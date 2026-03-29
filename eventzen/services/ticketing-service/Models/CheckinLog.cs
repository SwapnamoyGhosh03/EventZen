using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TicketingService.Models;

public class CheckinLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("registrationId")]
    public string RegistrationId { get; set; } = string.Empty;

    [BsonElement("ticketId")]
    public string TicketId { get; set; } = string.Empty;

    [BsonElement("eventId")]
    public string EventId { get; set; } = string.Empty;

    [BsonElement("attendeeId")]
    public string AttendeeId { get; set; } = string.Empty;

    [BsonElement("staffId")]
    public string StaffId { get; set; } = string.Empty;

    [BsonElement("gate")]
    public string Gate { get; set; } = string.Empty;

    [BsonElement("checkinTime")]
    public DateTime CheckinTime { get; set; } = DateTime.UtcNow;

    [BsonElement("method")]
    public string Method { get; set; } = "QR_SCAN"; // QR_SCAN | MANUAL
}
