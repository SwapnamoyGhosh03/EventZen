using System.Text.Json;
using Confluent.Kafka;
using FinanceService.Services;

namespace FinanceService.Infrastructure.Kafka;

public class VenueBookedConsumer(
    IConfiguration configuration,
    IServiceScopeFactory scopeFactory,
    ILogger<VenueBookedConsumer> logger) : BackgroundService
{
    private const string Topic = "venue.booked";
    private const string GroupId = "finance-service-venue";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var bootstrapServers = configuration["Kafka:BootstrapServers"] ?? "localhost:9092";
        var config = new ConsumerConfig
        {
            BootstrapServers = bootstrapServers,
            GroupId = GroupId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false,
        };

        try
        {
            using var consumer = new ConsumerBuilder<string, string>(config).Build();
            consumer.Subscribe(Topic);
            logger.LogInformation("VenueBookedConsumer started, listening to {Topic} on {Brokers}", Topic, bootstrapServers);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(TimeSpan.FromSeconds(1));
                    if (result is null) continue;

                    logger.LogInformation("Received venue.booked event: {Key}", result.Message.Key);

                    var payload = JsonSerializer.Deserialize<VenueBookedPayload>(
                        result.Message.Value,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (payload is not null && payload.TotalCost.HasValue && payload.TotalCost.Value > 0)
                    {
                        using var scope = scopeFactory.CreateScope();
                        var expenseService = scope.ServiceProvider.GetRequiredService<IExpenseService>();

                        await expenseService.AutoCreateVenueExpenseAsync(
                            payload.EventId,
                            payload.BookingId,
                            (decimal)payload.TotalCost.Value,
                            "INR",
                            payload.OrganizerId ?? "system");
                    }

                    consumer.Commit(result);
                }
                catch (ConsumeException ex)
                {
                    logger.LogError(ex, "Kafka consume error on topic {Topic}", Topic);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error processing venue.booked event");
                }
            }

            consumer.Close();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "VenueBookedConsumer failed to start (Kafka may be unavailable). Auto venue expenses via Kafka disabled.");
        }
    }
}

internal record VenueBookedPayload(
    string BookingId,
    string VenueId,
    string EventId,
    string? OrganizerId,
    double? TotalCost
);
