namespace FinanceService.DTOs;

public class CreatePaymentRequest
{
    public string EventId { get; set; } = string.Empty;
    public string? RegistrationId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? Description { get; set; }
}
