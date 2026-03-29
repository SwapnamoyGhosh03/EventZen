using FinanceService.Infrastructure.Data;
using FinanceService.Middleware;
using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceService.Services;

public interface IReportService
{
    Task<FinancialReport> GetFinancialReportAsync(string eventId);
}

public class ReportService(FinanceDbContext db, ILogger<ReportService> logger) : IReportService
{
    public async Task<FinancialReport> GetFinancialReportAsync(string eventId)
    {
        var budget = await db.Budgets
            .Include(b => b.BudgetItems)
            .FirstOrDefaultAsync(b => b.EventId == eventId);

        var expenses = await db.Expenses
            .Where(e => e.EventId == eventId)
            .ToListAsync();

        var payments = await db.Payments
            .Where(p => p.EventId == eventId)
            .ToListAsync();

        var totalExpenses = expenses.Sum(e => e.Amount);
        var totalPaymentsReceived = payments
            .Where(p => p.Status == PaymentStatus.COMPLETED)
            .Sum(p => p.Amount);

        var report = new FinancialReport
        {
            EventId = eventId,
            TotalBudgetEstimated = budget?.TotalEstimated ?? 0,
            TotalBudgetApproved = budget?.TotalApproved ?? 0,
            TotalExpenses = totalExpenses,
            TotalPaymentsReceived = totalPaymentsReceived,
            NetBalance = totalPaymentsReceived - totalExpenses,
            BudgetUtilizationPercent = budget is not null && budget.TotalApproved > 0
                ? Math.Round((totalExpenses / budget.TotalApproved) * 100, 2)
                : 0
        };

        // Expense breakdown by category
        if (budget?.BudgetItems.Count > 0)
        {
            var expensesByCategory = expenses
                .GroupBy(e => e.Category)
                .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));

            report.ExpensesByCategory = budget.BudgetItems
                .GroupBy(i => i.Category)
                .Select(g => new CategoryBreakdown
                {
                    Category = g.Key.ToString(),
                    EstimatedAmount = g.Sum(i => i.EstimatedAmount),
                    ActualAmount = expensesByCategory.GetValueOrDefault(g.Key, 0),
                    Variance = g.Sum(i => i.EstimatedAmount) - expensesByCategory.GetValueOrDefault(g.Key, 0)
                })
                .ToList();

            // Add categories that have expenses but no budget items
            foreach (var kvp in expensesByCategory)
            {
                if (!report.ExpensesByCategory.Any(c => c.Category == kvp.Key.ToString()))
                {
                    report.ExpensesByCategory.Add(new CategoryBreakdown
                    {
                        Category = kvp.Key.ToString(),
                        EstimatedAmount = 0,
                        ActualAmount = kvp.Value,
                        Variance = -kvp.Value
                    });
                }
            }
        }
        else
        {
            report.ExpensesByCategory = expenses
                .GroupBy(e => e.Category)
                .Select(g => new CategoryBreakdown
                {
                    Category = g.Key.ToString(),
                    EstimatedAmount = 0,
                    ActualAmount = g.Sum(e => e.Amount),
                    Variance = -g.Sum(e => e.Amount)
                })
                .ToList();
        }

        // Payment breakdown by status
        report.PaymentsByStatus = payments
            .GroupBy(p => p.Status)
            .Select(g => new PaymentSummary
            {
                Status = g.Key.ToString(),
                Count = g.Count(),
                TotalAmount = g.Sum(p => p.Amount)
            })
            .ToList();

        report.RecentExpenses = expenses
            .OrderByDescending(e => e.CreatedAt)
            .Take(200)
            .Select(e => new ExpenseAuditEntry
            {
                ExpenseId = e.ExpenseId,
                EventId = e.EventId,
                BudgetId = e.BudgetId,
                Category = e.Category.ToString(),
                Description = e.Description,
                Amount = e.Amount,
                Currency = e.Currency,
                Status = e.Status.ToString(),
                SubmittedBy = e.SubmittedBy,
                ApprovedBy = e.ApprovedBy,
                ReceiptUrl = e.ReceiptUrl,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToList();

        logger.LogInformation("Generated financial report for event {EventId}", eventId);
        return report;
    }
}
