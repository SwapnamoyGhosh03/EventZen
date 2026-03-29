namespace FinanceService.Models;

public enum ExpenseStatus
{
    SUBMITTED,
    APPROVED,
    REJECTED
}

public class Expense
{
    public string ExpenseId { get; set; } = Guid.NewGuid().ToString();
    public string EventId { get; set; } = string.Empty;
    public string? BudgetId { get; set; }
    public BudgetCategory Category { get; set; } = BudgetCategory.OTHER;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? ReceiptUrl { get; set; }
    public string SubmittedBy { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public ExpenseStatus Status { get; set; } = ExpenseStatus.SUBMITTED;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Budget? Budget { get; set; }
}
