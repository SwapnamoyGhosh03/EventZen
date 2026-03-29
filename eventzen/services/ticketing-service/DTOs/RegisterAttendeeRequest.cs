using System.ComponentModel.DataAnnotations;

namespace TicketingService.DTOs;

public class RegisterAttendeeRequest
{
    [Required]
    public string EventId { get; set; } = string.Empty;

    [Required]
    public string TicketTypeId { get; set; } = string.Empty;

    public string? PaymentId { get; set; }

    public string? AttendeeName { get; set; }

    public string? AttendeeEmail { get; set; }

    public string? EventTitle { get; set; }

    public string? EventDate { get; set; }

    public string? EventCity { get; set; }
}
