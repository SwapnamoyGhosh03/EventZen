using FinanceService.DTOs;
using FinanceService.Infrastructure.Auth;
using FinanceService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceService.Controllers;

[ApiController]
[Route("api/v1")]
[Produces("application/json")]
public class BudgetController(IBudgetService budgetService) : ControllerBase
{
    [HttpPost("events/{eventId}/budget")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> CreateBudget(string eventId, [FromBody] CreateBudgetRequest request)
    {
        var userId = User.GetUserId();
        var budget = await budgetService.CreateBudgetAsync(eventId, userId, request);
        return StatusCode(201, ApiResponse<object>.Ok(budget));
    }

    [HttpGet("events/{eventId}/budget")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> GetBudget(string eventId)
    {
        var budget = await budgetService.GetBudgetByEventAsync(eventId);

        var varianceAnalysis = budget.BudgetItems.Select(item => new
        {
            item.ItemId,
            item.Category,
            item.Description,
            item.EstimatedAmount,
            item.ActualAmount,
            Variance = item.EstimatedAmount - item.ActualAmount,
            VariancePercent = item.EstimatedAmount > 0
                ? Math.Round(((item.EstimatedAmount - item.ActualAmount) / item.EstimatedAmount) * 100, 2)
                : 0m
        });

        return Ok(ApiResponse<object>.Ok(new
        {
            budget.BudgetId,
            budget.EventId,
            budget.Title,
            budget.TotalEstimated,
            budget.TotalApproved,
            budget.TotalActual,
            budget.Currency,
            budget.Status,
            budget.ApprovedBy,
            budget.ApprovedAt,
            budget.Notes,
            budget.CreatedBy,
            budget.CreatedAt,
            budget.UpdatedAt,
            Items = varianceAnalysis
        }));
    }

    [HttpPut("budgets/{budgetId}/approve")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> ApproveBudget(string budgetId)
    {
        var userId = User.GetUserId();
        var budget = await budgetService.ApproveBudgetAsync(budgetId, userId);
        return Ok(ApiResponse<object>.Ok(budget));
    }

    [HttpPost("budgets/{budgetId}/items")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> AddBudgetItem(string budgetId, [FromBody] AddBudgetItemRequest request)
    {
        var item = await budgetService.AddBudgetItemAsync(budgetId, request);
        return StatusCode(201, ApiResponse<object>.Ok(item));
    }
}
