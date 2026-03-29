using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingService.DTOs;
using TicketingService.Services;

namespace TicketingService.Controllers;

[ApiController]
[Route("api/v1/tickets")]
public class TicketController : ControllerBase
{
    private readonly TicketService _ticketService;

    public TicketController(TicketService ticketService)
    {
        _ticketService = ticketService;
    }

    private string? ResolveUserId()
    {
        return User.FindFirst("UserId")?.Value
            ?? User.FindFirst("userId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
    }

    /// <summary>
    /// Get ticket by ID (Owner, ADMIN)
    /// </summary>
    [HttpGet("{ticketId}")]
    [Authorize]
    public async Task<IActionResult> GetTicket(string ticketId)
    {
        var userId = ResolveUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 401, Message = "User ID not found in token" }
            });
        }

        var ticket = await _ticketService.GetTicketByIdAsync(ticketId);
        if (ticket == null)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 404, Message = $"Ticket {ticketId} not found" }
            });

        var isAdmin = User.IsInRole("ADMIN");
        if (!isAdmin && ticket.AttendeeId != userId)
            return StatusCode(403, new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 403, Message = "You can only view your own tickets" }
            });

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = ticket
        });
    }

    /// <summary>
    /// Get my tickets (Authenticated)
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyTickets()
    {
        var userId = ResolveUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 401, Message = "User ID not found in token" }
            });
        }

        var tickets = await _ticketService.GetTicketsByAttendeeAsync(userId);
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = tickets,
            Meta = new { Count = tickets.Count }
        });
    }
}
