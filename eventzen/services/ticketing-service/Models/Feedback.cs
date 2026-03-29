using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TicketingService.Models;

public class Feedback
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("feedbackId")]
    public string FeedbackId { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("eventId")]
    public string EventId { get; set; } = string.Empty;

    [BsonElement("attendeeId")]
    public string AttendeeId { get; set; } = string.Empty;

    [BsonElement("eventRating")]
    public int EventRating { get; set; }

    [BsonElement("vendorRating")]
    public int VendorRating { get; set; }

    [BsonElement("platformRating")]
    public int PlatformRating { get; set; }

    [BsonElement("eventComment")]
    public string? EventComment { get; set; }

    [BsonElement("vendorComment")]
    public string? VendorComment { get; set; }

    [BsonElement("platformComment")]
    public string? PlatformComment { get; set; }

    [BsonElement("isShowcased")]
    public bool IsShowcased { get; set; } = false;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
