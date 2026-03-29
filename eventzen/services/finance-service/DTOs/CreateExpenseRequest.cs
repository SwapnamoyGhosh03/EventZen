using FinanceService.Models;

namespace FinanceService.DTOs;

public class CreateExpenseRequest
{
    public string EventId { get; set; } = string.Empty;
    public string? BudgetId { get; set; }
    public BudgetCategory Category { get; set; } = BudgetCategory.OTHER;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? ReceiptUrl { get; set; }
}
