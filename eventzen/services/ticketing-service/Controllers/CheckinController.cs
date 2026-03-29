using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingService.DTOs;
using TicketingService.Services;

namespace TicketingService.Controllers;

[ApiController]
[Route("api/v1")]
public class CheckinController : ControllerBase
{
    private readonly CheckinService _checkinService;

    public CheckinController(CheckinService checkinService)
    {
        _checkinService = checkinService;
    }

    /// <summary>
    /// QR scan check-in (ADMIN)
    /// </summary>
    [HttpPost("checkin/scan")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> ScanCheckin([FromBody] CheckinRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 400, Message = "Invalid request", Details = ModelState }
            });

        var staffId = User.FindFirst("UserId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Staff ID not found in token");

        var checkinLog = await _checkinService.ProcessCheckinAsync(request, staffId);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = checkinLog
        });
    }

    /// <summary>
    /// Get live check-in stats for an event (ADMIN, ORGANIZER)
    /// </summary>
    [HttpGet("events/{eventId}/checkin/stats")]
    [Authorize(Roles = "ADMIN,ORGANIZER")]
    public async Task<IActionResult> GetCheckinStats(string eventId)
    {
        var stats = await _checkinService.GetCheckinStatsAsync(eventId);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = stats
        });
    }
}
