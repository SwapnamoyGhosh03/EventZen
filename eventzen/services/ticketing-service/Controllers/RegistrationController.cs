using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingService.DTOs;
using TicketingService.Services;

namespace TicketingService.Controllers;

[ApiController]
[Route("api/v1/registrations")]
public class RegistrationController : ControllerBase
{
    private readonly RegistrationService _registrationService;

    public RegistrationController(RegistrationService registrationService)
    {
        _registrationService = registrationService;
    }

    /// <summary>
    /// Register attendee for an event (Authenticated, requires Idempotency-Key header)
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> RegisterAttendee([FromBody] RegisterAttendeeRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 400, Message = "Invalid request", Details = ModelState }
            });

        var userId = User.FindFirst("UserId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token");

        var idempotencyKey = Request.Headers["Idempotency-Key"].ToString();
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 400, Message = "Idempotency-Key header is required" }
            });
        }

        var registration = await _registrationService.RegisterAttendeeAsync(request, userId, idempotencyKey);
        return Created($"/api/v1/registrations/{registration.RegistrationId}", new ApiResponse<object>
        {
            Success = true,
            Data = registration
        });
    }

    /// <summary>
    /// Get my registrations (Authenticated)
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyRegistrations()
    {
        var userId = User.FindFirst("UserId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token");

        var registrations = await _registrationService.GetMyRegistrationsAsync(userId);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = registrations,
            Meta = new { Count = registrations.Count }
        });
    }

    /// <summary>
    /// Get event registrations (ADMIN, ORGANIZER)
    /// </summary>
    [HttpGet("/api/v1/events/{eventId}/registrations")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> GetEventRegistrations(string eventId)
    {
        var registrations = await _registrationService.GetEventRegistrationsAsync(eventId);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = registrations,
            Meta = new { Count = registrations.Count }
        });
    }

    /// <summary>
    /// Admin cleanup: cancel registrations that exceed the per-user limit for every ticket type.
    /// </summary>
    [HttpPost("cleanup-excess")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CleanupExcessRegistrations()
    {
        var count = await _registrationService.CleanupExcessRegistrationsAsync();
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = new { CancelledCount = count, Message = $"{count} excess registration(s) cancelled" }
        });
    }

    /// <summary>
    /// Cancel registration (Owner, ADMIN)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> CancelRegistration(string id)
    {
        var userId = User.FindFirst("UserId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User ID not found in token");

        var isAdmin = User.IsInRole("ADMIN");
        var registration = await _registrationService.CancelRegistrationAsync(id, userId, isAdmin);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = registration
        });
    }
}
