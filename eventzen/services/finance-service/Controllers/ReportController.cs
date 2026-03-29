using FinanceService.DTOs;
using FinanceService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceService.Controllers;

[ApiController]
[Route("api/v1")]
[Produces("application/json")]
public class ReportController(IReportService reportService) : ControllerBase
{
    [HttpGet("events/{eventId}/reports/financial")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> GetFinancialReport(string eventId)
    {
        var report = await reportService.GetFinancialReportAsync(eventId);
        return Ok(ApiResponse<object>.Ok(report));
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public IActionResult Health()
    {
        return Ok(ApiResponse<object>.Ok(new
        {
            status = "healthy",
            service = "finance-service",
            timestamp = DateTime.UtcNow
        }));
    }
}
