using System.Text.Json;
using TicketingService.DTOs;
using TicketingService.Infrastructure.Redis;

namespace TicketingService.Middleware;

public class IdempotencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<IdempotencyMiddleware> _logger;

    public IdempotencyMiddleware(RequestDelegate next, ILogger<IdempotencyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RedisService redisService)
    {
        // Only apply to POST /api/v1/registrations
        if (context.Request.Method != "POST" ||
            !context.Request.Path.StartsWithSegments("/api/v1/registrations"))
        {
            await _next(context);
            return;
        }

        // Check for Idempotency-Key header
        if (!context.Request.Headers.TryGetValue("Idempotency-Key", out var idempotencyKey) ||
            string.IsNullOrWhiteSpace(idempotencyKey))
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json";
            var errorResponse = new ApiResponse<object>
            {
                Success = false,
                Error = new { Code = 400, Message = "Idempotency-Key header is required for registration requests" }
            };
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            await context.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, jsonOptions));
            return;
        }

        var cacheKey = $"idempotency:{idempotencyKey}";

        // Check if we have a cached response
        var cachedResponse = await redisService.GetAsync(cacheKey);
        if (cachedResponse != null)
        {
            _logger.LogInformation("Returning cached response for idempotency key: {Key}", idempotencyKey.ToString());
            context.Response.StatusCode = 200;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(cachedResponse);
            return;
        }

        // Replace the response body stream to capture the response
        var originalBodyStream = context.Response.Body;
        using var memoryStream = new MemoryStream();
        context.Response.Body = memoryStream;

        try
        {
            await _next(context);
        }
        catch
        {
            // Restore original body stream so ExceptionMiddleware can write to it
            context.Response.Body = originalBodyStream;
            throw;
        }

        // Read the response
        memoryStream.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(memoryStream).ReadToEndAsync();

        // Cache successful responses for 24 hours
        if (context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
        {
            await redisService.SetAsync(cacheKey, responseBody, TimeSpan.FromHours(24));
        }

        // Copy the response back to the original stream
        memoryStream.Seek(0, SeekOrigin.Begin);
        await memoryStream.CopyToAsync(originalBodyStream);
        context.Response.Body = originalBodyStream;
    }
}
