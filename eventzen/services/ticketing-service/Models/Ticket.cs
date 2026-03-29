using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TicketingService.Models;

[BsonIgnoreExtraElements]
public class Ticket
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("ticketId")]
    public string TicketId { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("registrationId")]
    public string RegistrationId { get; set; } = string.Empty;

    [BsonElement("eventId")]
    public string EventId { get; set; } = string.Empty;

    [BsonElement("attendeeId")]
    public string AttendeeId { get; set; } = string.Empty;

    [BsonElement("ticketTypeId")]
    public string? TicketTypeId { get; set; }

    [BsonElement("ticketType")]
    public string TicketType { get; set; } = string.Empty;

    [BsonElement("eventTitle")]
    public string? EventTitle { get; set; }

    [BsonElement("eventDate")]
    public string? EventDate { get; set; }

    [BsonElement("eventCity")]
    public string? EventCity { get; set; }

    [BsonElement("qrCodeData")]
    public string QrCodeData { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE | USED | CANCELLED | EXPIRED

    [BsonElement("bookingGroupId")]
    public string? BookingGroupId { get; set; }

    [BsonElement("groupQuantity")]
    public int? GroupQuantity { get; set; }

    [BsonElement("checkedInAt")]
    public DateTime? CheckedInAt { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
