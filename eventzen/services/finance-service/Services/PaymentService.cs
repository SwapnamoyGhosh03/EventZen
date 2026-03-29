using System.Text.Json;
using FinanceService.DTOs;
using FinanceService.Infrastructure.Data;
using FinanceService.Infrastructure.Kafka;
using FinanceService.Middleware;
using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceService.Services;

public class PaymentIntentResult
{
    public string GatewayPaymentId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public interface IPaymentGateway
{
    Task<PaymentIntentResult> CreatePaymentIntent(decimal amount, string currency, Dictionary<string, string> metadata);
    Task<Models.PaymentStatus> VerifyPayment(string gatewayPaymentId);
}

public class SimulatedPaymentGateway(ILogger<SimulatedPaymentGateway> logger) : IPaymentGateway
{
    public Task<PaymentIntentResult> CreatePaymentIntent(decimal amount, string currency, Dictionary<string, string> metadata)
    {
        var fakeId = $"ez_pay_{Guid.NewGuid():N}";
        logger.LogInformation("[EventZen Pay] Simulated payment: {Id} for {Amount} {Currency}", fakeId, amount, currency);
        return Task.FromResult(new PaymentIntentResult
        {
            GatewayPaymentId = fakeId,
            Status = "succeeded"
        });
    }

    public Task<Models.PaymentStatus> VerifyPayment(string gatewayPaymentId)
        => Task.FromResult(Models.PaymentStatus.COMPLETED);
}

public interface IPaymentService
{
    Task<Payment> InitiatePaymentAsync(string userId, CreatePaymentRequest request);
    Task<Payment> VerifyPaymentAsync(string paymentId);
}

public class PaymentService(
    FinanceDbContext db,
    IPaymentGateway gateway,
    IKafkaProducer kafka,
    ILogger<PaymentService> logger) : IPaymentService
{
    public async Task<Payment> InitiatePaymentAsync(string userId, CreatePaymentRequest request)
    {
        if (request.Amount <= 0)
            throw new FinanceException("FIN-4005", "Payment amount must be positive");

        var metadata = new Dictionary<string, string>
        {
            ["eventId"] = request.EventId,
            ["userId"] = userId,
            ["registrationId"] = request.RegistrationId ?? ""
        };

        var intentResult = await gateway.CreatePaymentIntent(request.Amount, request.Currency, metadata);

        var payment = new Payment
        {
            EventId = request.EventId,
            UserId = userId,
            RegistrationId = request.RegistrationId,
            Amount = request.Amount,
            Currency = request.Currency,
            Status = Models.PaymentStatus.COMPLETED,
            PaymentMethod = Models.PaymentMethod.EVENTZEN,
            GatewayPaymentId = intentResult.GatewayPaymentId,
            Description = request.Description,
            PaidAt = DateTime.UtcNow
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync();

        // Publish payment received event for downstream services
        await kafka.PublishAsync("payment.received", payment.EventId, new
        {
            payment.PaymentId,
            payment.EventId,
            payment.UserId,
            payment.Amount,
            payment.Currency,
            payment.RegistrationId,
            Timestamp = DateTime.UtcNow
        });

        logger.LogInformation("Payment {PaymentId} completed for event {EventId} via EventZen Pay",
            payment.PaymentId, request.EventId);

        return payment;
    }

    public async Task<Payment> VerifyPaymentAsync(string paymentId)
    {
        var payment = await db.Payments.FindAsync(paymentId)
            ?? throw new FinanceException("FIN-4004", "Payment not found", 404);

        return payment;
    }
}
