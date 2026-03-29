using MongoDB.Driver;
using TicketingService.DTOs;
using TicketingService.Infrastructure.Kafka;
using TicketingService.Infrastructure.MongoDB;
using TicketingService.Infrastructure.Redis;
using TicketingService.Models;

namespace TicketingService.Services;

public class RegistrationService
{
    private readonly MongoDbContext _db;
    private readonly RedisService _redis;
    private readonly TicketService _ticketService;
    private readonly QrCodeService _qrCodeService;
    private readonly WaitlistService _waitlistService;
    private readonly KafkaProducer _kafka;
    private readonly ILogger<RegistrationService> _logger;

    public RegistrationService(
        MongoDbContext db,
        RedisService redis,
        TicketService ticketService,
        QrCodeService qrCodeService,
        WaitlistService waitlistService,
        KafkaProducer kafka,
        ILogger<RegistrationService> logger)
    {
        _db = db;
        _redis = redis;
        _ticketService = ticketService;
        _qrCodeService = qrCodeService;
        _waitlistService = waitlistService;
        _kafka = kafka;
        _logger = logger;
    }

    public async Task<Registration> RegisterAttendeeAsync(RegisterAttendeeRequest request, string attendeeId, string idempotencyKey)
    {
        // Check if registration already exists with this idempotency key
        var existing = await _db.Registrations
            .Find(r => r.IdempotencyKey == idempotencyKey)
            .FirstOrDefaultAsync();
        if (existing != null)
        {
            return existing;
        }

        // Get ticket type
        var ticketType = await _ticketService.GetTicketTypeByIdAsync(request.TicketTypeId)
            ?? throw new KeyNotFoundException($"Ticket type {request.TicketTypeId} not found");

        if (!ticketType.IsActive)
            throw new InvalidOperationException("This ticket type is no longer active");

        if (ticketType.SaleStart != default && DateTime.UtcNow < ticketType.SaleStart)
            throw new InvalidOperationException("Ticket sales have not started yet");

        if (ticketType.SaleEnd != default && DateTime.UtcNow > ticketType.SaleEnd)
            throw new InvalidOperationException("Ticket sales have ended");

        // Check max per user — Redis counter is fast path, MongoDB is source of truth.
        // If Redis is stale (e.g. after manual DB cleanup), heal it before enforcing limits.
        var userCountKey = $"user_count:{attendeeId}:{request.TicketTypeId}";
        var dbCount = (long)await _db.Registrations.CountDocumentsAsync(r =>
            r.AttendeeId == attendeeId
            && r.TicketTypeId == request.TicketTypeId
            && r.Status != "CANCELLED");

        var redisCountRaw = await _redis.GetAsync(userCountKey);
        var hasRedisCount = long.TryParse(redisCountRaw, out var redisCount);

        if (!hasRedisCount)
        {
            await _redis.SetAsync(userCountKey, dbCount.ToString(), TimeSpan.FromDays(30));
        }
        else if (redisCount > dbCount)
        {
            // Redis can drift high if registrations are removed outside normal cancellation flow.
            await _redis.SetAsync(userCountKey, dbCount.ToString(), TimeSpan.FromDays(30));
        }

        var userCount = await _redis.IncrementAsync(userCountKey);
        if (userCount > ticketType.MaxPerUser)
        {
            await _redis.DecrementAsync(userCountKey);
            throw new InvalidOperationException($"Maximum {ticketType.MaxPerUser} tickets per user for this ticket type");
        }

        // Check availability via Redis DECR (atomic)
        var availabilityKey = $"ticket_availability:{request.TicketTypeId}";
        var remaining = await _redis.DecrementAsync(availabilityKey);

        if (remaining < 0)
        {
            // Restore the counter
            await _redis.IncrementAsync(availabilityKey);

            // Add to waitlist instead
            var waitlistEntry = await _waitlistService.AddToWaitlistAsync(request.EventId, attendeeId, request.TicketTypeId);

            var waitlistedRegistration = new Registration
            {
                EventId = request.EventId,
                AttendeeId = attendeeId,
                AttendeeName = request.AttendeeName,
                AttendeeEmail = request.AttendeeEmail,
                TicketTypeId = request.TicketTypeId,
                IdempotencyKey = idempotencyKey,
                Status = "WAITLISTED",
                AmountPaid = 0
            };

            await _db.Registrations.InsertOneAsync(waitlistedRegistration);
            _logger.LogInformation("Attendee {AttendeeId} waitlisted for event {EventId}", attendeeId, request.EventId);
            return waitlistedRegistration;
        }

        // Create registration
        var registration = new Registration
        {
            EventId = request.EventId,
            AttendeeId = attendeeId,
            AttendeeName = request.AttendeeName,
            AttendeeEmail = request.AttendeeEmail,
            TicketTypeId = request.TicketTypeId,
            IdempotencyKey = idempotencyKey,
            Status = "CONFIRMED",
            PaymentId = request.PaymentId,
            AmountPaid = ticketType.Price
        };

        // Pre-generate ticket ID so the QR code HMAC is signed with the actual ticket ID
        var preGeneratedTicketId = Guid.NewGuid().ToString();
        var qrCodeData = _qrCodeService.GenerateQrCode(preGeneratedTicketId);
        var ticket = await _ticketService.CreateTicketAsync(
            registration.RegistrationId,
            request.EventId,
            attendeeId,
            !string.IsNullOrEmpty(ticketType.Name) ? ticketType.Name : ticketType.Type,
            qrCodeData,
            request.EventTitle,
            request.EventDate,
            request.EventCity,
            ticketType.TicketTypeId,
            preGeneratedTicketId);

        registration.TicketId = ticket.TicketId;
        await _db.Registrations.InsertOneAsync(registration);

        // Update MongoDB availability
        var update = Builders<TicketType>.Update.Inc(t => t.AvailableQuantity, -1);
        await _db.TicketTypes.UpdateOneAsync(t => t.TicketTypeId == request.TicketTypeId, update);

        // Publish Kafka events
        _ = Task.Run(async () =>
        {
            try
            {
                await _kafka.ProduceAsync("registration.confirmed", registration.RegistrationId, new
                {
                    registration.RegistrationId,
                    registration.EventId,
                    registration.AttendeeId,
                    registration.TicketTypeId,
                    ticket.TicketId,
                    registration.AmountPaid,
                    registration.RegisteredAt
                });

                await _kafka.ProduceAsync("ticket.purchased", ticket.TicketId, new
                {
                    ticket.TicketId,
                    ticket.EventId,
                    ticket.AttendeeId,
                    ticket.TicketType,
                    ticket.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish registration events");
            }
        });

        _logger.LogInformation("Registration {RegistrationId} confirmed for attendee {AttendeeId}",
            registration.RegistrationId, attendeeId);

        return registration;
    }

    /// <summary>
    /// Cancel registrations that exceed each ticket type's MaxPerUser limit.
    /// Keeps the earliest registrations and cancels the excess newest ones.
    /// Returns the number of registrations cancelled.
    /// </summary>
    public async Task<int> CleanupExcessRegistrationsAsync()
    {
        var ticketTypes = await _db.TicketTypes.Find(_ => true).ToListAsync();
        int cancelled = 0;

        foreach (var tt in ticketTypes)
        {
            if (tt.MaxPerUser <= 0) continue;

            // All active registrations for this ticket type, oldest first
            var regs = await _db.Registrations
                .Find(r => r.TicketTypeId == tt.TicketTypeId && r.Status != "CANCELLED")
                .SortBy(r => r.RegisteredAt)
                .ToListAsync();

            // Group by attendee
            var byAttendee = regs.GroupBy(r => r.AttendeeId);
            foreach (var group in byAttendee)
            {
                var excess = group.Skip(tt.MaxPerUser).ToList();
                foreach (var reg in excess)
                {
                    var upd = Builders<Registration>.Update
                        .Set(r => r.Status, "CANCELLED")
                        .Set(r => r.CancelledAt, DateTime.UtcNow)
                        .Set(r => r.CancellationReason, "Exceeded per-user ticket limit (admin cleanup)");
                    await _db.Registrations.UpdateOneAsync(r => r.RegistrationId == reg.RegistrationId, upd);

                    if (reg.TicketId != null)
                        await _ticketService.CancelTicketAsync(reg.TicketId);

                    // Restore availability
                    await _redis.IncrementAsync($"ticket_availability:{reg.TicketTypeId}");
                    var ttUpd = Builders<TicketType>.Update.Inc(t => t.AvailableQuantity, 1);
                    await _db.TicketTypes.UpdateOneAsync(t => t.TicketTypeId == reg.TicketTypeId, ttUpd);

                    // Sync per-user Redis counter
                    var userCountKey = $"user_count:{reg.AttendeeId}:{reg.TicketTypeId}";
                    if (await _redis.ExistsAsync(userCountKey))
                        await _redis.DecrementAsync(userCountKey);

                    cancelled++;
                    _logger.LogInformation("Admin cleanup: cancelled excess registration {RegistrationId} for attendee {AttendeeId}",
                        reg.RegistrationId, reg.AttendeeId);
                }
            }
        }

        return cancelled;
    }

    public async Task<List<Registration>> GetMyRegistrationsAsync(string attendeeId)
    {
        return await _db.Registrations
            .Find(r => r.AttendeeId == attendeeId)
            .SortByDescending(r => r.RegisteredAt)
            .ToListAsync();
    }

    public async Task<List<Registration>> GetEventRegistrationsAsync(string eventId)
    {
        return await _db.Registrations
            .Find(r => r.EventId == eventId)
            .SortByDescending(r => r.RegisteredAt)
            .ToListAsync();
    }

    public async Task<Registration> CancelRegistrationAsync(string registrationId, string userId, bool isAdmin)
    {
        var registration = await _db.Registrations
            .Find(r => r.RegistrationId == registrationId)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Registration {registrationId} not found");

        if (!isAdmin && registration.AttendeeId != userId)
            throw new UnauthorizedAccessException("You can only cancel your own registration");

        if (registration.Status == "CANCELLED")
            throw new InvalidOperationException("Registration is already cancelled");

        // Update registration
        var update = Builders<Registration>.Update
            .Set(r => r.Status, "CANCELLED")
            .Set(r => r.CancelledAt, DateTime.UtcNow)
            .Set(r => r.CancellationReason, "Cancelled by " + (isAdmin ? "admin" : "attendee"));

        await _db.Registrations.UpdateOneAsync(r => r.RegistrationId == registrationId, update);

        // Cancel ticket if exists
        if (registration.TicketId != null)
        {
            await _ticketService.CancelTicketAsync(registration.TicketId);
        }

        // Decrement per-user Redis counter so the slot is freed
        var userCountKey = $"user_count:{registration.AttendeeId}:{registration.TicketTypeId}";
        if (await _redis.ExistsAsync(userCountKey))
            await _redis.DecrementAsync(userCountKey);

        // INCR Redis counter to release the ticket
        var availabilityKey = $"ticket_availability:{registration.TicketTypeId}";
        await _redis.IncrementAsync(availabilityKey);

        // Update MongoDB availability
        var ticketTypeUpdate = Builders<TicketType>.Update.Inc(t => t.AvailableQuantity, 1);
        await _db.TicketTypes.UpdateOneAsync(t => t.TicketTypeId == registration.TicketTypeId, ticketTypeUpdate);

        // Auto-promote from waitlist
        _ = Task.Run(async () =>
        {
            try
            {
                await _waitlistService.TryPromoteNextAsync(registration.EventId, registration.TicketTypeId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to auto-promote from waitlist");
            }
        });

        // Publish cancellation event
        _ = Task.Run(async () =>
        {
            try
            {
                await _kafka.ProduceAsync("registration.cancelled", registration.RegistrationId, new
                {
                    registration.RegistrationId,
                    registration.EventId,
                    registration.AttendeeId,
                    CancelledAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish cancellation event");
            }
        });

        registration.Status = "CANCELLED";
        registration.CancelledAt = DateTime.UtcNow;
        return registration;
    }
}
