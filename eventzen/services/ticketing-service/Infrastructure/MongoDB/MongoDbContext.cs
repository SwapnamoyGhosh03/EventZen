using MongoDB.Driver;
using TicketingService.Models;

namespace TicketingService.Infrastructure.MongoDB;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration["MongoDB:ConnectionString"]
            ?? throw new ArgumentNullException("MongoDB:ConnectionString is not configured");
        var databaseName = configuration["MongoDB:DatabaseName"]
            ?? throw new ArgumentNullException("MongoDB:DatabaseName is not configured");

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
    }

    public IMongoCollection<TicketType> TicketTypes => _database.GetCollection<TicketType>("ticket_types");
    public IMongoCollection<Registration> Registrations => _database.GetCollection<Registration>("registrations");
    public IMongoCollection<Ticket> Tickets => _database.GetCollection<Ticket>("tickets");
    public IMongoCollection<CheckinLog> CheckinLogs => _database.GetCollection<CheckinLog>("checkin_logs");
    public IMongoCollection<Waitlist> Waitlists => _database.GetCollection<Waitlist>("waitlists");
    public IMongoCollection<Feedback> Feedbacks => _database.GetCollection<Feedback>("feedbacks");

    public async Task ConfigureIndexesAsync()
    {
        // TicketType indexes
        await TicketTypes.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<TicketType>(
                Builders<TicketType>.IndexKeys.Ascending(t => t.EventId)),
            new CreateIndexModel<TicketType>(
                Builders<TicketType>.IndexKeys.Ascending(t => t.TicketTypeId),
                new CreateIndexOptions { Unique = true })
        ]);

        // Registration indexes
        await Registrations.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<Registration>(
                Builders<Registration>.IndexKeys.Ascending(r => r.EventId)),
            new CreateIndexModel<Registration>(
                Builders<Registration>.IndexKeys.Ascending(r => r.AttendeeId)),
            new CreateIndexModel<Registration>(
                Builders<Registration>.IndexKeys.Ascending(r => r.RegistrationId),
                new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Registration>(
                Builders<Registration>.IndexKeys.Ascending(r => r.IdempotencyKey),
                new CreateIndexOptions { Unique = true })
        ]);

        // Ticket indexes
        await Tickets.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<Ticket>(
                Builders<Ticket>.IndexKeys.Ascending(t => t.TicketId),
                new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Ticket>(
                Builders<Ticket>.IndexKeys.Ascending(t => t.AttendeeId)),
            new CreateIndexModel<Ticket>(
                Builders<Ticket>.IndexKeys.Ascending(t => t.EventId))
        ]);

        // CheckinLog indexes
        await CheckinLogs.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<CheckinLog>(
                Builders<CheckinLog>.IndexKeys.Ascending(c => c.EventId)),
            new CreateIndexModel<CheckinLog>(
                Builders<CheckinLog>.IndexKeys.Ascending(c => c.TicketId))
        ]);

        // Waitlist indexes
        await Waitlists.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<Waitlist>(
                Builders<Waitlist>.IndexKeys.Ascending(w => w.WaitlistId),
                new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Waitlist>(
                Builders<Waitlist>.IndexKeys
                    .Ascending(w => w.EventId)
                    .Ascending(w => w.TicketTypeId)
                    .Ascending(w => w.Position))
        ]);

        // Feedback indexes
        await Feedbacks.Indexes.CreateManyAsync(
        [
            new CreateIndexModel<Feedback>(
                Builders<Feedback>.IndexKeys.Ascending(f => f.FeedbackId),
                new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Feedback>(
                Builders<Feedback>.IndexKeys
                    .Ascending(f => f.EventId)
                    .Ascending(f => f.AttendeeId))
        ]);
    }
}
