namespace FinanceService.Models;

public enum PaymentStatus
{
    PENDING,
    COMPLETED,
    FAILED,
    REFUNDED
}

public enum PaymentMethod
{
    STRIPE,
    RAZORPAY,
    EVENTZEN
}

public class Payment
{
    public string PaymentId { get; set; } = Guid.NewGuid().ToString();
    public string EventId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? RegistrationId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.STRIPE;
    public string? GatewayPaymentId { get; set; }
    public string? GatewayResponse { get; set; }
    public string? Description { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
