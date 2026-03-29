namespace FinanceService.DTOs;

public class AutoVenueExpenseRequest
{
    public string EventId { get; set; } = string.Empty;
    public string BookingId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
}
