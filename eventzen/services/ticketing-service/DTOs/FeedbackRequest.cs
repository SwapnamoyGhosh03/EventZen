using System.ComponentModel.DataAnnotations;

namespace TicketingService.DTOs;

public class FeedbackRequest
{
    [Range(1, 5)]
    public int EventRating { get; set; }

    [Range(1, 5)]
    public int VendorRating { get; set; }

    [Range(1, 5)]
    public int PlatformRating { get; set; }

    [MaxLength(1000)]
    public string? EventComment { get; set; }

    [MaxLength(1000)]
    public string? VendorComment { get; set; }

    [MaxLength(1000)]
    public string? PlatformComment { get; set; }
}

public class ShowcaseRequest
{
    public bool Showcase { get; set; }
}
