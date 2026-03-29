using FinanceService.DTOs;
using FinanceService.Infrastructure.Auth;
using FinanceService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceService.Controllers;

[ApiController]
[Route("api/v1")]
[Produces("application/json")]
public class SponsorshipController(ISponsorshipService sponsorshipService) : ControllerBase
{
    [HttpPost("events/{eventId}/sponsorships")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> AddSponsorship(string eventId, [FromBody] CreateSponsorshipRequest request)
    {
        var vendorId = User.GetUserId();
        var sponsorship = await sponsorshipService.AddSponsorshipAsync(eventId, vendorId, request);
        return StatusCode(201, ApiResponse<object>.Ok(sponsorship));
    }

    [HttpGet("events/{eventId}/sponsorships")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSponsorships(string eventId)
    {
        var sponsorships = await sponsorshipService.GetSponsorshipsAsync(eventId);
        return Ok(ApiResponse<object>.Ok(sponsorships));
    }
}
