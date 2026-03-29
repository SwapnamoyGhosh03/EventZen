using FinanceService.DTOs;
using FinanceService.Infrastructure.Auth;
using FinanceService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceService.Controllers;

[ApiController]
[Route("api/v1/expenses")]
[Produces("application/json")]
public class ExpenseController(IExpenseService expenseService) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        var userId = User.GetUserId();
        var expense = await expenseService.CreateExpenseAsync(userId, request);
        return StatusCode(201, ApiResponse<object>.Ok(expense));
    }

    [HttpPost("venue-auto")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> AutoVenueExpense([FromBody] AutoVenueExpenseRequest request)
    {
        var userId = User.GetUserId();
        var (created, expense) = await expenseService.AutoCreateVenueExpenseAsync(
            request.EventId, request.BookingId, request.Amount, request.Currency, userId);
        if (!created)
            return Ok(ApiResponse<object>.Ok(new { alreadyExists = true }));
        return StatusCode(201, ApiResponse<object>.Ok(expense));
    }
}
