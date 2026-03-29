namespace TicketingService.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public object? Meta { get; set; }
    public object? Error { get; set; }
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
}
