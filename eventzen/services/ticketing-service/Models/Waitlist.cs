using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TicketingService.Models;

public class Waitlist
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("waitlistId")]
    public string WaitlistId { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("eventId")]
    public string EventId { get; set; } = string.Empty;

    [BsonElement("attendeeId")]
    public string AttendeeId { get; set; } = string.Empty;

    [BsonElement("ticketTypeId")]
    public string TicketTypeId { get; set; } = string.Empty;

    [BsonElement("position")]
    public int Position { get; set; }

    [BsonElement("joinTime")]
    public DateTime JoinTime { get; set; } = DateTime.UtcNow;

    [BsonElement("status")]
    public string Status { get; set; } = "WAITING"; // WAITING | PROMOTED | EXPIRED | CANCELLED

    [BsonElement("promotedAt")]
    public DateTime? PromotedAt { get; set; }

    [BsonElement("promotionExpiresAt")]
    public DateTime? PromotionExpiresAt { get; set; }
}
