using MongoDB.Driver;
using TicketingService.DTOs;
using TicketingService.Infrastructure.MongoDB;
using TicketingService.Infrastructure.Redis;
using TicketingService.Models;

namespace TicketingService.Services;

public class TicketService
{
    private readonly MongoDbContext _db;
    private readonly RedisService _redis;
    private readonly ILogger<TicketService> _logger;

    public TicketService(MongoDbContext db, RedisService redis, ILogger<TicketService> logger)
    {
        _db = db;
        _redis = redis;
        _logger = logger;
    }

    public async Task<List<TicketType>> GetTicketTypesByEventAsync(string eventId)
    {
        var filter = Builders<TicketType>.Filter.Eq(t => t.EventId, eventId)
            & Builders<TicketType>.Filter.Eq(t => t.IsActive, true);
        return await _db.TicketTypes.Find(filter).ToListAsync();
    }

    public async Task<TicketType?> GetTicketTypeByIdAsync(string ticketTypeId)
    {
        return await _db.TicketTypes
            .Find(t => t.TicketTypeId == ticketTypeId)
            .FirstOrDefaultAsync();
    }

    public async Task<TicketType> CreateTicketTypeAsync(string eventId, CreateTicketTypeRequest request, string? organizerId = null)
    {
        var ticketType = new TicketType
        {
            EventId = eventId,
            Name = request.Name,
            Type = request.Type,
            Price = request.Price,
            Currency = request.Currency,
            TotalQuantity = request.TotalQuantity,
            AvailableQuantity = request.TotalQuantity,
            MaxPerUser = request.MaxPerUser,
            SaleStart = request.SaleStart,
            SaleEnd = request.SaleEnd,
            Description = request.Description,
            SeatMapImageUrl = request.SeatMapImageUrl,
            OrganizerId = organizerId
        };

        await _db.TicketTypes.InsertOneAsync(ticketType);

        // Initialize Redis availability counter
        await _redis.InitializeTicketAvailabilityAsync(ticketType.TicketTypeId, ticketType.TotalQuantity);

        _logger.LogInformation("Created ticket type {TicketTypeId} for event {EventId}", ticketType.TicketTypeId, eventId);
        return ticketType;
    }

    public async Task<TicketType?> UpdateTicketTypeAsync(string ticketTypeId, UpdateTicketTypeRequest request)
    {
        var updates = new List<UpdateDefinition<TicketType>>();
        if (request.Name != null)
            updates.Add(Builders<TicketType>.Update.Set(t => t.Name, request.Name));
        if (request.Price.HasValue)
            updates.Add(Builders<TicketType>.Update.Set(t => t.Price, request.Price.Value));
        if (request.TotalQuantity.HasValue)
            updates.Add(Builders<TicketType>.Update.Set(t => t.TotalQuantity, request.TotalQuantity.Value));
        if (request.Description != null)
            updates.Add(Builders<TicketType>.Update.Set(t => t.Description, request.Description));
        if (request.SeatMapImageUrl != null)
            updates.Add(Builders<TicketType>.Update.Set(t => t.SeatMapImageUrl,
                request.SeatMapImageUrl == "" ? null : request.SeatMapImageUrl));
        if (request.Type != null)
            updates.Add(Builders<TicketType>.Update.Set(t => t.Type, request.Type));
        if (request.SaleEnd.HasValue)
            updates.Add(Builders<TicketType>.Update.Set(t => t.SaleEnd, request.SaleEnd.Value));
        if (request.MaxPerUser.HasValue)
            updates.Add(Builders<TicketType>.Update.Set(t => t.MaxPerUser, Math.Clamp(request.MaxPerUser.Value, 1, 10)));
        updates.Add(Builders<TicketType>.Update.Set(t => t.UpdatedAt, DateTime.UtcNow));

        var combined = Builders<TicketType>.Update.Combine(updates);
        await _db.TicketTypes.UpdateOneAsync(t => t.TicketTypeId == ticketTypeId, combined);
        return await GetTicketTypeByIdAsync(ticketTypeId);
    }

    public async Task<bool> DeleteTicketTypeAsync(string ticketTypeId)
    {
        var update = Builders<TicketType>.Update
            .Set(t => t.IsActive, false)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);
        var result = await _db.TicketTypes.UpdateOneAsync(t => t.TicketTypeId == ticketTypeId, update);
        return result.ModifiedCount > 0;
    }

    public async Task<Ticket?> GetTicketByIdAsync(string ticketId)
    {
        return await _db.Tickets
            .Find(t => t.TicketId == ticketId)
            .FirstOrDefaultAsync();
    }

    public async Task<List<Ticket>> GetTicketsByAttendeeAsync(string attendeeId)
    {
        return await _db.Tickets
            .Find(t => t.AttendeeId == attendeeId)
            .ToListAsync();
    }

    public async Task<Ticket> CreateTicketAsync(string registrationId, string eventId, string attendeeId, string ticketType, string qrCodeData, string? eventTitle = null, string? eventDate = null, string? eventCity = null, string? ticketTypeId = null, string? preGeneratedId = null)
    {
        var ticket = new Ticket
        {
            TicketId = preGeneratedId ?? Guid.NewGuid().ToString(),
            RegistrationId = registrationId,
            EventId = eventId,
            AttendeeId = attendeeId,
            TicketTypeId = ticketTypeId,
            TicketType = ticketType,
            QrCodeData = qrCodeData,
            EventTitle = eventTitle,
            EventDate = eventDate,
            EventCity = eventCity
        };

        await _db.Tickets.InsertOneAsync(ticket);
        _logger.LogInformation("Created ticket {TicketId} for registration {RegistrationId}", ticket.TicketId, registrationId);
        return ticket;
    }

    public async Task CancelTicketAsync(string ticketId)
    {
        var update = Builders<Ticket>.Update
            .Set(t => t.Status, "CANCELLED");
        await _db.Tickets.UpdateOneAsync(t => t.TicketId == ticketId, update);
    }

    public async Task MarkTicketAsUsedAsync(string ticketId)
    {
        var update = Builders<Ticket>.Update
            .Set(t => t.Status, "USED")
            .Set(t => t.CheckedInAt, DateTime.UtcNow);
        await _db.Tickets.UpdateOneAsync(t => t.TicketId == ticketId, update);
    }
}
