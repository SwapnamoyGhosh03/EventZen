using MongoDB.Driver;
using TicketingService.DTOs;
using TicketingService.Infrastructure.MongoDB;
using TicketingService.Models;

namespace TicketingService.Services;

public class CheckinService
{
    private readonly MongoDbContext _db;
    private readonly TicketService _ticketService;
    private readonly QrCodeService _qrCodeService;
    private readonly ILogger<CheckinService> _logger;

    public CheckinService(
        MongoDbContext db,
        TicketService ticketService,
        QrCodeService qrCodeService,
        ILogger<CheckinService> logger)
    {
        _db = db;
        _ticketService = ticketService;
        _qrCodeService = qrCodeService;
        _logger = logger;
    }

    public async Task<CheckinLog> ProcessCheckinAsync(CheckinRequest request, string staffId)
    {
        // Validate QR HMAC
        if (!_qrCodeService.ValidateQrCode(request.QrCodeData))
            throw new ArgumentException("Invalid QR code: HMAC verification failed");

        var ticketId = _qrCodeService.ExtractTicketId(request.QrCodeData);

        // Get ticket
        var ticket = await _ticketService.GetTicketByIdAsync(ticketId)
            ?? throw new KeyNotFoundException($"Ticket {ticketId} not found");

        // Validate ticket status
        if (ticket.Status == "USED")
            throw new InvalidOperationException("Ticket has already been used for check-in");
        if (ticket.Status == "CANCELLED")
            throw new InvalidOperationException("Ticket has been cancelled");
        if (ticket.Status == "EXPIRED")
            throw new InvalidOperationException("Ticket has expired");

        // Validate event matches (only when EventId is provided)
        if (!string.IsNullOrEmpty(request.EventId) && ticket.EventId != request.EventId)
            throw new ArgumentException("Ticket does not belong to this event");

        // Mark ticket as used
        await _ticketService.MarkTicketAsUsedAsync(ticketId);

        // Create checkin log
        var checkinLog = new CheckinLog
        {
            RegistrationId = ticket.RegistrationId,
            TicketId = ticket.TicketId,
            EventId = request.EventId,
            AttendeeId = ticket.AttendeeId,
            StaffId = staffId,
            Gate = request.Gate,
            Method = request.Method
        };

        await _db.CheckinLogs.InsertOneAsync(checkinLog);

        _logger.LogInformation("Check-in completed for ticket {TicketId} at gate {Gate}", ticketId, request.Gate);
        return checkinLog;
    }

    public async Task<object> GetCheckinStatsAsync(string eventId)
    {
        var totalCheckins = await _db.CheckinLogs
            .CountDocumentsAsync(c => c.EventId == eventId);

        var checkinsByGate = await _db.CheckinLogs
            .Aggregate()
            .Match(c => c.EventId == eventId)
            .Group(c => c.Gate, g => new { Gate = g.Key, Count = g.Count() })
            .ToListAsync();

        var checkinsByMethod = await _db.CheckinLogs
            .Aggregate()
            .Match(c => c.EventId == eventId)
            .Group(c => c.Method, g => new { Method = g.Key, Count = g.Count() })
            .ToListAsync();

        var recentCheckins = await _db.CheckinLogs
            .Find(c => c.EventId == eventId)
            .SortByDescending(c => c.CheckinTime)
            .Limit(10)
            .ToListAsync();

        return new
        {
            TotalCheckins = totalCheckins,
            ByGate = checkinsByGate,
            ByMethod = checkinsByMethod,
            RecentCheckins = recentCheckins
        };
    }
}
