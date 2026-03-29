using System.ComponentModel.DataAnnotations;

namespace TicketingService.DTOs;

public class UpdateTicketTypeRequest
{
    public string? Name { get; set; }
    public decimal? Price { get; set; }
    public int? TotalQuantity { get; set; }
    public string? Description { get; set; }
    public string? SeatMapImageUrl { get; set; }
    public string? Type { get; set; }
    public DateTime? SaleEnd { get; set; }

    [Range(1, 10)]
    public int? MaxPerUser { get; set; }
}
