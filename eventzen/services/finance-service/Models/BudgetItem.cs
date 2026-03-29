namespace FinanceService.Models;

public enum BudgetCategory
{
    VENUE,
    CATERING,
    AV,
    MARKETING,
    STAFF,
    DECOR,
    SECURITY,
    LOGISTICS,
    OTHER
}

public class BudgetItem
{
    public string ItemId { get; set; } = Guid.NewGuid().ToString();
    public string BudgetId { get; set; } = string.Empty;
    public BudgetCategory Category { get; set; } = BudgetCategory.OTHER;
    public string Description { get; set; } = string.Empty;
    public decimal EstimatedAmount { get; set; }
    public decimal ActualAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Budget Budget { get; set; } = null!;
}
