using MongoDB.Driver;
using TicketingService.Infrastructure.MongoDB;
using TicketingService.Models;

namespace TicketingService.Services;

public class WaitlistService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<WaitlistService> _logger;

    public WaitlistService(MongoDbContext db, ILogger<WaitlistService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Waitlist> AddToWaitlistAsync(string eventId, string attendeeId, string ticketTypeId)
    {
        // Get current max position
        var maxPosition = await _db.Waitlists
            .Find(w => w.EventId == eventId && w.TicketTypeId == ticketTypeId && w.Status == "WAITING")
            .SortByDescending(w => w.Position)
            .Limit(1)
            .FirstOrDefaultAsync();

        var nextPosition = (maxPosition?.Position ?? 0) + 1;

        var waitlistEntry = new Waitlist
        {
            EventId = eventId,
            AttendeeId = attendeeId,
            TicketTypeId = ticketTypeId,
            Position = nextPosition
        };

        await _db.Waitlists.InsertOneAsync(waitlistEntry);
        _logger.LogInformation("Added attendee {AttendeeId} to waitlist at position {Position} for ticket type {TicketTypeId}",
            attendeeId, nextPosition, ticketTypeId);

        return waitlistEntry;
    }

    public async Task TryPromoteNextAsync(string eventId, string ticketTypeId)
    {
        // Find the next person on the waitlist
        var nextInLine = await _db.Waitlists
            .Find(w => w.EventId == eventId && w.TicketTypeId == ticketTypeId && w.Status == "WAITING")
            .SortBy(w => w.Position)
            .Limit(1)
            .FirstOrDefaultAsync();

        if (nextInLine == null)
        {
            _logger.LogInformation("No one on waitlist for event {EventId} ticket type {TicketTypeId}", eventId, ticketTypeId);
            return;
        }

        // Promote the waitlist entry
        var update = Builders<Waitlist>.Update
            .Set(w => w.Status, "PROMOTED")
            .Set(w => w.PromotedAt, DateTime.UtcNow)
            .Set(w => w.PromotionExpiresAt, DateTime.UtcNow.AddHours(24));

        await _db.Waitlists.UpdateOneAsync(w => w.WaitlistId == nextInLine.WaitlistId, update);

        _logger.LogInformation("Promoted attendee {AttendeeId} from waitlist for event {EventId}",
            nextInLine.AttendeeId, eventId);
    }
}
