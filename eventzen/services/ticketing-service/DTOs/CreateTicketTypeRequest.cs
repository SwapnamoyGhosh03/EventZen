using System.ComponentModel.DataAnnotations;

namespace TicketingService.DTOs;

public class CreateTicketTypeRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("GENERAL|VIP|SPEAKER|SPONSOR")]
    public string Type { get; set; } = "GENERAL";

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }

    public string Currency { get; set; } = "USD";

    [Range(1, int.MaxValue)]
    public int TotalQuantity { get; set; }

    [Range(1, 10)]
    public int MaxPerUser { get; set; } = 10;

    public DateTime SaleStart { get; set; }

    public DateTime SaleEnd { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? SeatMapImageUrl { get; set; }
}
