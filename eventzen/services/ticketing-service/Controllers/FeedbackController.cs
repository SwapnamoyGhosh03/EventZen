using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketingService.DTOs;
using TicketingService.Services;

namespace TicketingService.Controllers;

[ApiController]
[Route("api/v1/events/{eventId}/feedback")]
public class FeedbackController : ControllerBase
{
    private readonly FeedbackService _feedbackService;

    public FeedbackController(FeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    private string GetUserId() =>
        User.FindFirst("UserId")?.Value
        ?? User.FindFirst("userId")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException("User ID not found in token");

    /// <summary>Submit feedback for an event (any authenticated user)</summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> SubmitFeedback(string eventId, [FromBody] FeedbackRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 400, Message = "Invalid request", Details = ModelState }
            });

        var feedback = await _feedbackService.SubmitFeedbackAsync(eventId, GetUserId(), request);
        return Created($"/api/v1/events/{eventId}/feedback", new ApiResponse<object>
        {
            Success = true,
            Data = feedback
        });
    }

    /// <summary>Get feedback summary for an event (any authenticated user)</summary>
    [HttpGet("summary")]
    [Authorize]
    public async Task<IActionResult> GetFeedbackSummary(string eventId)
    {
        var summary = await _feedbackService.GetFeedbackSummaryAsync(eventId);
        return Ok(new ApiResponse<object> { Success = true, Data = summary });
    }

    /// <summary>Get all individual reviews for an event (ADMIN, ORGANIZER, VENDOR)</summary>
    [HttpGet("reviews")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> GetEventReviews(string eventId)
    {
        var reviews = await _feedbackService.GetEventReviewsAsync(eventId);
        return Ok(new ApiResponse<object> { Success = true, Data = reviews });
    }

    /// <summary>Get showcased (public) reviews for an event (no auth required)</summary>
    [HttpGet("public")]
    public async Task<IActionResult> GetPublicReviews(string eventId)
    {
        var reviews = await _feedbackService.GetPublicReviewsAsync(eventId);
        return Ok(new ApiResponse<object> { Success = true, Data = reviews });
    }

    /// <summary>Toggle showcase status of a review (ADMIN, ORGANIZER, VENDOR)</summary>
    [HttpPatch("{feedbackId}/showcase")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> ToggleShowcase(string eventId, string feedbackId, [FromBody] ShowcaseRequest request)
    {
        var success = await _feedbackService.ToggleShowcaseAsync(eventId, feedbackId, request.Showcase);
        if (!success)
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Error = new { Message = "Review not found" }
            });

        return Ok(new ApiResponse<object> { Success = true, Data = new { showcased = request.Showcase } });
    }

    /// <summary>Get aggregated feedback for an event (ADMIN, ORGANIZER, VENDOR)</summary>
    [HttpGet]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> GetAggregatedFeedback(string eventId)
    {
        var feedback = await _feedbackService.GetAggregatedFeedbackAsync(eventId);
        return Ok(new ApiResponse<object> { Success = true, Data = feedback });
    }

    /// <summary>Get bulk review summaries for multiple events (ADMIN, ORGANIZER, VENDOR)</summary>
    [HttpPost("/api/v1/feedback/bulk-summary")]
    [Authorize(Roles = "ADMIN,ORGANIZER,VENDOR")]
    public async Task<IActionResult> GetBulkSummary([FromBody] string[] eventIds)
    {
        var summaries = await _feedbackService.GetBulkSummariesAsync(eventIds ?? Array.Empty<string>());
        return Ok(new ApiResponse<object> { Success = true, Data = summaries });
    }

    /// <summary>Get all feedback submitted by the current user</summary>
    [HttpGet("/api/v1/feedback/me")]
    [Authorize]
    public async Task<IActionResult> GetMyFeedback()
    {
        var feedbacks = await _feedbackService.GetMyFeedbackAsync(GetUserId());
        return Ok(new ApiResponse<object> { Success = true, Data = feedbacks });
    }
}
