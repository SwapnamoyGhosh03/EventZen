namespace FinanceService.Models;

public class FinancialReport
{
    public string EventId { get; set; } = string.Empty;
    public decimal TotalBudgetEstimated { get; set; }
    public decimal TotalBudgetApproved { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal TotalPaymentsReceived { get; set; }
    public decimal NetBalance { get; set; }
    public decimal BudgetUtilizationPercent { get; set; }
    public List<CategoryBreakdown> ExpensesByCategory { get; set; } = [];
    public List<PaymentSummary> PaymentsByStatus { get; set; } = [];
    public List<ExpenseAuditEntry> RecentExpenses { get; set; } = [];
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class CategoryBreakdown
{
    public string Category { get; set; } = string.Empty;
    public decimal EstimatedAmount { get; set; }
    public decimal ActualAmount { get; set; }
    public decimal Variance { get; set; }
}

public class PaymentSummary
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
}

public class ExpenseAuditEntry
{
    public string ExpenseId { get; set; } = string.Empty;
    public string EventId { get; set; } = string.Empty;
    public string? BudgetId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = string.Empty;
    public string SubmittedBy { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public string? ReceiptUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
