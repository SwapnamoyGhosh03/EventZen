using FinanceService.Models;

namespace FinanceService.DTOs;

public class CreateBudgetRequest
{
    public string Title { get; set; } = string.Empty;
    public decimal TotalEstimated { get; set; }
    public string Currency { get; set; } = "INR";
    public string? Notes { get; set; }
    public List<AddBudgetItemRequest> Items { get; set; } = [];
}
