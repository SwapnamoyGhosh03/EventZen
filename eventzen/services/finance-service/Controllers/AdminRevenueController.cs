using FinanceService.DTOs;
using FinanceService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceService.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Produces("application/json")]
public class AdminRevenueController(IAdminRevenueService adminRevenueService) : ControllerBase
{
    [HttpGet("revenue")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminRevenue()
    {
        var report = await adminRevenueService.GetAdminRevenueAsync();
        return Ok(ApiResponse<object>.Ok(report));
    }
}
