using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingService.DTOs;
using TicketingService.Services;

namespace TicketingService.Controllers;

[ApiController]
[Route("api/v1")]
public class TicketTypeController : ControllerBase
{
    private readonly TicketService _ticketService;

    public TicketTypeController(TicketService ticketService)
    {
        _ticketService = ticketService;
    }

    /// <summary>
    /// List ticket types for an event (Public)
    /// </summary>
    [HttpGet("ticket-types")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTicketTypes([FromQuery] string eventId)
    {
        if (string.IsNullOrWhiteSpace(eventId))
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 400, Message = "eventId query parameter is required" }
            });

        var ticketTypes = await _ticketService.GetTicketTypesByEventAsync(eventId);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = ticketTypes,
            Meta = new { Count = ticketTypes.Count }
        });
    }

    /// <summary>
    /// Create a new ticket type for an event (ADMIN, ORGANIZER)
    /// </summary>
    [HttpPost("events/{eventId}/ticket-types")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> CreateTicketType(string eventId, [FromBody] CreateTicketTypeRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 400, Message = "Invalid request", Details = ModelState }
            });

        var organizerId = User.FindFirst("UserId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var ticketType = await _ticketService.CreateTicketTypeAsync(eventId, request, organizerId);
        return Created($"/api/v1/ticket-types?eventId={eventId}", new ApiResponse<object>
        {
            Success = true,
            Data = ticketType
        });
    }

    /// <summary>
    /// Update a ticket type (ADMIN can update any; ORGANIZER can only update their own)
    /// </summary>
    [HttpPut("ticket-types/{ticketTypeId}")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> UpdateTicketType(string ticketTypeId, [FromBody] UpdateTicketTypeRequest request)
    {
        var existing = await _ticketService.GetTicketTypeByIdAsync(ticketTypeId);
        if (existing == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 404, Message = "Ticket type not found" }
            });

        var isAdmin = User.IsInRole("ADMIN");
        if (!isAdmin)
        {
            var userId = User.FindFirst("UserId")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (existing.OrganizerId != null && existing.OrganizerId != userId)
                return Forbid();
        }

        var updated = await _ticketService.UpdateTicketTypeAsync(ticketTypeId, request);
        return Ok(new ApiResponse<object> { Success = true, Data = updated });
    }

    /// <summary>
    /// Delete (deactivate) a ticket type (ADMIN can delete any; ORGANIZER can only delete their own)
    /// </summary>
    [HttpDelete("ticket-types/{ticketTypeId}")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> DeleteTicketType(string ticketTypeId)
    {
        var existing = await _ticketService.GetTicketTypeByIdAsync(ticketTypeId);
        if (existing == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 404, Message = "Ticket type not found" }
            });

        var isAdmin = User.IsInRole("ADMIN");
        if (!isAdmin)
        {
            var userId = User.FindFirst("UserId")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (existing.OrganizerId != null && existing.OrganizerId != userId)
                return Forbid();
        }

        await _ticketService.DeleteTicketTypeAsync(ticketTypeId);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = new { Message = "Ticket type deleted" }
        });
    }
}
