using FinanceService.Models;

namespace FinanceService.DTOs;

public class AddBudgetItemRequest
{
    public BudgetCategory Category { get; set; } = BudgetCategory.OTHER;
    public string Description { get; set; } = string.Empty;
    public decimal EstimatedAmount { get; set; }
    public decimal ActualAmount { get; set; }
    public string? Notes { get; set; }
}
