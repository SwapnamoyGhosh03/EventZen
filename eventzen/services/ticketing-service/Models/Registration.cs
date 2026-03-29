using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TicketingService.Models;

public class Registration
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("registrationId")]
    public string RegistrationId { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("eventId")]
    public string EventId { get; set; } = string.Empty;

    [BsonElement("attendeeId")]
    public string AttendeeId { get; set; } = string.Empty;

    [BsonElement("attendeeName")]
    public string? AttendeeName { get; set; }

    [BsonElement("attendeeEmail")]
    public string? AttendeeEmail { get; set; }

    [BsonElement("ticketTypeId")]
    public string TicketTypeId { get; set; } = string.Empty;

    [BsonElement("ticketId")]
    public string? TicketId { get; set; }

    [BsonElement("idempotencyKey")]
    public string IdempotencyKey { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "CONFIRMED"; // CONFIRMED | CANCELLED | WAITLISTED

    [BsonElement("paymentId")]
    public string? PaymentId { get; set; }

    [BsonElement("amountPaid")]
    public decimal AmountPaid { get; set; }

    [BsonElement("registeredAt")]
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

    [BsonElement("cancelledAt")]
    public DateTime? CancelledAt { get; set; }

    [BsonElement("cancellationReason")]
    public string? CancellationReason { get; set; }
}
