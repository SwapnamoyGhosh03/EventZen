using System.Text.Json.Serialization;

namespace FinanceService.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public object? Meta { get; set; }
    public ApiError? Error { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> Ok(T data, object? meta = null) => new()
    {
        Success = true,
        Data = data,
        Meta = meta
    };

    public static ApiResponse<T> Fail(string code, string message, int statusCode = 400) => new()
    {
        Success = false,
        Error = new ApiError { Code = code, Message = message, StatusCode = statusCode }
    };
}

public class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    [JsonIgnore]
    public int StatusCode { get; set; } = 400;
}
