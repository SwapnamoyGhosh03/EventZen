using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TicketingService.Models;

public class TicketType
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("ticketTypeId")]
    public string TicketTypeId { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("eventId")]
    public string EventId { get; set; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("type")]
    public string Type { get; set; } = "GENERAL"; // GENERAL | VIP | SPEAKER | SPONSOR

    [BsonElement("price")]
    public decimal Price { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "USD";

    [BsonElement("totalQuantity")]
    public int TotalQuantity { get; set; }

    [BsonElement("availableQuantity")]
    public int AvailableQuantity { get; set; }

    [BsonElement("maxPerUser")]
    public int MaxPerUser { get; set; } = 1;

    [BsonElement("saleStart")]
    public DateTime SaleStart { get; set; }

    [BsonElement("saleEnd")]
    public DateTime SaleEnd { get; set; }

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("seatMapImageUrl")]
    public string? SeatMapImageUrl { get; set; }

    [BsonElement("organizerId")]
    public string? OrganizerId { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
