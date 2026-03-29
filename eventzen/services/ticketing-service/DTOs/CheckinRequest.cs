using System.ComponentModel.DataAnnotations;

namespace TicketingService.DTOs;

public class CheckinRequest
{
    [Required]
    public string QrCodeData { get; set; } = string.Empty;

    public string? EventId { get; set; }

    public string Gate { get; set; } = string.Empty;

    public string Method { get; set; } = "QR_SCAN"; // QR_SCAN | MANUAL
}
