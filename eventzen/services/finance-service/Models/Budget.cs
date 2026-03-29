namespace FinanceService.Models;

public enum BudgetStatus
{
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    CLOSED
}

public class Budget
{
    public string BudgetId { get; set; } = Guid.NewGuid().ToString();
    public string EventId { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal TotalEstimated { get; set; }
    public decimal TotalApproved { get; set; }
    public decimal TotalActual { get; set; }
    public string Currency { get; set; } = "INR";
    public BudgetStatus Status { get; set; } = BudgetStatus.DRAFT;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BudgetItem> BudgetItems { get; set; } = new List<BudgetItem>();
}
