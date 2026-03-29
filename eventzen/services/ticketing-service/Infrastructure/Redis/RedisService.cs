using StackExchange.Redis;

namespace TicketingService.Infrastructure.Redis;

public class RedisService
{
    private readonly IConnectionMultiplexer _connection;
    private readonly IDatabase _db;

    public RedisService(IConfiguration configuration)
    {
        var connectionString = configuration["Redis:ConnectionString"] ?? "localhost:6379";
        _connection = ConnectionMultiplexer.Connect(connectionString);
        _db = _connection.GetDatabase();
    }

    public async Task<long> DecrementAsync(string key)
    {
        return await _db.StringDecrementAsync(key);
    }

    public async Task<long> IncrementAsync(string key)
    {
        return await _db.StringIncrementAsync(key);
    }

    public async Task<bool> SetAsync(string key, string value, TimeSpan? expiry = null)
    {
        return await _db.StringSetAsync(key, value, expiry);
    }

    public async Task<string?> GetAsync(string key)
    {
        var value = await _db.StringGetAsync(key);
        return value.HasValue ? value.ToString() : null;
    }

    public async Task<bool> ExistsAsync(string key)
    {
        return await _db.KeyExistsAsync(key);
    }

    public async Task<bool> SetIfNotExistsAsync(string key, string value, TimeSpan? expiry = null)
    {
        return await _db.StringSetAsync(key, value, expiry, When.NotExists);
    }

    public async Task InitializeTicketAvailabilityAsync(string ticketTypeId, int availableQuantity)
    {
        var key = $"ticket_availability:{ticketTypeId}";
        var exists = await _db.KeyExistsAsync(key);
        if (!exists)
        {
            await _db.StringSetAsync(key, availableQuantity);
        }
    }

    public async Task<long> GetAvailabilityAsync(string ticketTypeId)
    {
        var key = $"ticket_availability:{ticketTypeId}";
        var value = await _db.StringGetAsync(key);
        return value.HasValue ? (long)value : 0;
    }
}
