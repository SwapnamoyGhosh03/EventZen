using FinanceService.DTOs;
using FinanceService.Infrastructure.Data;
using FinanceService.Infrastructure.Kafka;
using FinanceService.Middleware;
using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceService.Services;

public interface IExpenseService
{
    Task<Expense> CreateExpenseAsync(string userId, CreateExpenseRequest request);
    Task<(bool created, Expense? expense)> AutoCreateVenueExpenseAsync(
        string eventId, string bookingId, decimal amount, string currency, string organizerId);
}

public class ExpenseService(
    FinanceDbContext db,
    IKafkaProducer kafka,
    ILogger<ExpenseService> logger) : IExpenseService
{
    public async Task<Expense> CreateExpenseAsync(string userId, CreateExpenseRequest request)
    {
        if (request.Amount <= 0)
            throw new FinanceException("FIN-4005", "Expense amount must be positive");

        // Check budget threshold if budget is associated
        Budget? budget = null;
        if (!string.IsNullOrEmpty(request.BudgetId))
        {
            budget = await db.Budgets.FindAsync(request.BudgetId);
            if (budget is null)
                throw new FinanceException("FIN-4004", "Associated budget not found", 404);
        }
        else
        {
            // Try to find budget by eventId
            budget = await db.Budgets.FirstOrDefaultAsync(b => b.EventId == request.EventId);
        }

        var expense = new Expense
        {
            EventId = request.EventId,
            BudgetId = budget?.BudgetId ?? request.BudgetId,
            Category = request.Category,
            Description = request.Description,
            Amount = request.Amount,
            Currency = request.Currency,
            ReceiptUrl = request.ReceiptUrl,
            SubmittedBy = userId,
            Status = ExpenseStatus.SUBMITTED
        };

        db.Expenses.Add(expense);

        // Update budget actual totals and check thresholds
        if (budget is not null)
        {
            var currentExpenses = await db.Expenses
                .Where(e => e.BudgetId == budget.BudgetId)
                .SumAsync(e => e.Amount);

            var newTotal = currentExpenses + request.Amount;
            budget.TotalActual = newTotal;
            budget.UpdatedAt = DateTime.UtcNow;

            // Check if over budget
            if (budget.TotalApproved > 0 && newTotal > budget.TotalApproved)
            {
                throw new FinanceException("FIN-4001",
                    $"Expense exceeds approved budget. Approved: {budget.TotalApproved:C}, " +
                    $"Current total with this expense: {newTotal:C}");
            }

            // Check threshold alerts
            if (budget.TotalApproved > 0)
            {
                var utilizationPercent = (newTotal / budget.TotalApproved) * 100;

                if (utilizationPercent >= 100)
                {
                    await kafka.PublishAsync("budget.alert.threshold", budget.EventId, new
                    {
                        budget.BudgetId,
                        budget.EventId,
                        UserId = budget.CreatedBy,
                        ThresholdPercent = 100,
                        UtilizationPercent = Math.Round(utilizationPercent, 2),
                        TotalApproved = budget.TotalApproved,
                        TotalActual = newTotal,
                        Timestamp = DateTime.UtcNow
                    });
                    logger.LogWarning("Budget {BudgetId} has reached 100% utilization", budget.BudgetId);
                }
                else if (utilizationPercent >= 80)
                {
                    await kafka.PublishAsync("budget.alert.threshold", budget.EventId, new
                    {
                        budget.BudgetId,
                        budget.EventId,
                        UserId = budget.CreatedBy,
                        ThresholdPercent = 80,
                        UtilizationPercent = Math.Round(utilizationPercent, 2),
                        TotalApproved = budget.TotalApproved,
                        TotalActual = newTotal,
                        Timestamp = DateTime.UtcNow
                    });
                    logger.LogWarning("Budget {BudgetId} has reached 80% utilization", budget.BudgetId);
                }
            }
        }

        await db.SaveChangesAsync();

        logger.LogInformation("Expense {ExpenseId} created for event {EventId} by {UserId}",
            expense.ExpenseId, request.EventId, userId);

        return expense;
    }

    public async Task<(bool created, Expense? expense)> AutoCreateVenueExpenseAsync(
        string eventId, string bookingId, decimal amount, string currency, string organizerId)
    {
        if (amount <= 0) return (false, null);

        var description = $"Venue Booking: {bookingId}";

        // Idempotency: skip if expense for this booking already exists
        var exists = await db.Expenses.AnyAsync(e => e.EventId == eventId && e.Description == description);
        if (exists)
        {
            logger.LogDebug("Venue expense for booking {BookingId} already exists, skipping", bookingId);
            return (false, null);
        }

        var budget = await db.Budgets.FirstOrDefaultAsync(b => b.EventId == eventId);

        var expense = new Expense
        {
            EventId = eventId,
            BudgetId = budget?.BudgetId,
            Category = BudgetCategory.VENUE,
            Description = description,
            Amount = amount,
            Currency = string.IsNullOrEmpty(currency) ? "INR" : currency,
            SubmittedBy = organizerId,
            Status = ExpenseStatus.APPROVED,
        };

        db.Expenses.Add(expense);

        if (budget is not null)
        {
            var currentExpenses = await db.Expenses
                .Where(e => e.BudgetId == budget.BudgetId)
                .SumAsync(e => e.Amount);

            var newTotal = currentExpenses + amount;
            budget.TotalActual = newTotal;
            budget.UpdatedAt = DateTime.UtcNow;

            if (budget.TotalApproved > 0)
            {
                var utilizationPercent = (newTotal / budget.TotalApproved) * 100;
                var threshold = utilizationPercent >= 100 ? 100 : utilizationPercent >= 80 ? 80 : 0;
                if (threshold > 0)
                {
                    await kafka.PublishAsync("budget.alert.threshold", budget.EventId, new
                    {
                        budget.BudgetId,
                        budget.EventId,
                        UserId = budget.CreatedBy,
                        ThresholdPercent = threshold,
                        UtilizationPercent = Math.Round(utilizationPercent, 2),
                        TotalApproved = budget.TotalApproved,
                        TotalActual = newTotal,
                        Timestamp = DateTime.UtcNow
                    });
                }
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Auto-created venue expense for event {EventId} from booking {BookingId}", eventId, bookingId);
        return (true, expense);
    }
}
