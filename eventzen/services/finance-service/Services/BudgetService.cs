using FinanceService.DTOs;
using FinanceService.Infrastructure.Data;
using FinanceService.Infrastructure.Kafka;
using FinanceService.Middleware;
using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceService.Services;

public interface IBudgetService
{
    Task<Budget> CreateBudgetAsync(string eventId, string userId, CreateBudgetRequest request);
    Task<Budget> GetBudgetByEventAsync(string eventId);
    Task<Budget> ApproveBudgetAsync(string budgetId, string approvedBy);
    Task<BudgetItem> AddBudgetItemAsync(string budgetId, AddBudgetItemRequest request);
}

public class BudgetService(FinanceDbContext db, IKafkaProducer kafka, ILogger<BudgetService> logger) : IBudgetService
{
    public async Task<Budget> CreateBudgetAsync(string eventId, string userId, CreateBudgetRequest request)
    {
        var existing = await db.Budgets.AnyAsync(b => b.EventId == eventId);
        if (existing)
            throw new FinanceException("FIN-4002", "Budget already exists for this event", 409);

        var budget = new Budget
        {
            EventId = eventId,
            CreatedBy = userId,
            Title = request.Title,
            TotalEstimated = request.TotalEstimated,
            Currency = request.Currency,
            Notes = request.Notes,
            // Budgets are self-approved by the vendor — no admin approval required
            Status = BudgetStatus.APPROVED,
            ApprovedBy = userId,
            ApprovedAt = DateTime.UtcNow,
        };

        foreach (var item in request.Items)
        {
            budget.BudgetItems.Add(new BudgetItem
            {
                BudgetId = budget.BudgetId,
                Category = item.Category,
                Description = item.Description,
                EstimatedAmount = item.EstimatedAmount,
                ActualAmount = item.ActualAmount,
                Notes = item.Notes
            });
        }

        budget.TotalEstimated = budget.BudgetItems.Sum(i => i.EstimatedAmount);
        budget.TotalApproved = budget.TotalEstimated;

        db.Budgets.Add(budget);
        await db.SaveChangesAsync();

        logger.LogInformation("Budget {BudgetId} created for event {EventId}", budget.BudgetId, eventId);
        return budget;
    }

    public async Task<Budget> GetBudgetByEventAsync(string eventId)
    {
        var budget = await db.Budgets
            .Include(b => b.BudgetItems)
            .FirstOrDefaultAsync(b => b.EventId == eventId)
            ?? throw new FinanceException("FIN-4004", "Budget not found for this event", 404);

        return budget;
    }

    public async Task<Budget> ApproveBudgetAsync(string budgetId, string approvedBy)
    {
        var budget = await db.Budgets
            .Include(b => b.BudgetItems)
            .FirstOrDefaultAsync(b => b.BudgetId == budgetId)
            ?? throw new FinanceException("FIN-4004", "Budget not found", 404);

        if (budget.Status == BudgetStatus.APPROVED)
            throw new FinanceException("FIN-4003", "Budget is already approved");

        budget.Status = BudgetStatus.APPROVED;
        budget.ApprovedBy = approvedBy;
        budget.ApprovedAt = DateTime.UtcNow;
        budget.TotalApproved = budget.TotalEstimated;
        budget.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        logger.LogInformation("Budget {BudgetId} approved by {ApprovedBy}", budgetId, approvedBy);
        return budget;
    }

    public async Task<BudgetItem> AddBudgetItemAsync(string budgetId, AddBudgetItemRequest request)
    {
        var budget = await db.Budgets.FindAsync(budgetId)
            ?? throw new FinanceException("FIN-4004", "Budget not found", 404);

        var item = new BudgetItem
        {
            BudgetId = budgetId,
            Category = request.Category,
            Description = request.Description,
            EstimatedAmount = request.EstimatedAmount,
            ActualAmount = request.ActualAmount,
            Notes = request.Notes
        };

        db.BudgetItems.Add(item);

        budget.TotalEstimated += item.EstimatedAmount;
        budget.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        logger.LogInformation("Budget item {ItemId} added to budget {BudgetId}", item.ItemId, budgetId);
        return item;
    }
}
