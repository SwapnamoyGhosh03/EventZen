using System.Text.Json.Serialization;
using FinanceService.Infrastructure.Auth;
using FinanceService.Infrastructure.Data;
using FinanceService.Infrastructure.Kafka;
using FinanceService.Middleware;
using FinanceService.Models;
using FinanceService.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Prometheus;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// ----- EF Core + MySQL (Pomelo) -----
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection not configured");

builder.Services.AddDbContext<FinanceDbContext>(options =>
    options.UseMySQL(connectionString));

// ----- Redis -----
var redisConnectionString = builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    try
    {
        return ConnectionMultiplexer.Connect(redisConnectionString);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: Redis connection failed: {ex.Message}. Continuing without Redis.");
        return null!;
    }
});

// ----- Kafka Producer -----
builder.Services.AddSingleton<IKafkaProducer, KafkaProducer>();

// ----- Kafka Consumer: auto-create venue expenses when venues are booked -----
builder.Services.AddHostedService<VenueBookedConsumer>();

// ----- Payment Gateway (EventZen Pay — simulated) -----
builder.Services.AddScoped<IPaymentGateway, SimulatedPaymentGateway>();
Console.WriteLine("[EventZen Pay] Using built-in simulated payment gateway.");

// ----- Application Services -----
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ISponsorshipService, SponsorshipService>();
builder.Services.AddScoped<IAdminRevenueService, AdminRevenueService>();

// ----- JWT Authentication -----
builder.Services.AddAuthentication("JwtBearer")
    .AddScheme<AuthenticationSchemeOptions, JwtAuthHandler>("JwtBearer", null);

builder.Services.AddAuthorization();

// ----- Controllers + JSON -----
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ----- Swagger -----
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EventZen Finance Service",
        Version = "v1",
        Description = "Finance & Budget management for EventZen"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ----- CORS -----
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();
await InitializeDatabaseAndSeedAsync(app.Services);

static async Task InitializeDatabaseAndSeedAsync(IServiceProvider services)
{
    const int maxAttempts = 24;
    var retryDelay = TimeSpan.FromSeconds(5);

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();

        try
        {
            if (!await db.Database.CanConnectAsync())
            {
                throw new InvalidOperationException("MySQL not reachable yet.");
            }

            var pendingMigrations = await db.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                await db.Database.MigrateAsync();
                Console.WriteLine("Database migrations applied successfully.");
            }
            else
            {
                await db.Database.EnsureCreatedAsync();
                Console.WriteLine("Database schema ensured.");
            }

            await EnsureSponsorshipTableAsync(db);
            await SeedDemoSponsorshipsAsync(db);
            Console.WriteLine("Finance DB bootstrap completed.");
            return;
        }
        catch (Exception ex)
        {
            if (attempt == maxAttempts)
            {
                Console.WriteLine($"Warning: finance DB bootstrap exhausted retries: {ex.Message}");
                return;
            }

            Console.WriteLine($"Finance DB bootstrap attempt {attempt}/{maxAttempts} failed: {ex.Message}");
            await Task.Delay(retryDelay);
        }
    }
}

static async Task EnsureSponsorshipTableAsync(FinanceDbContext db)
{
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS `Sponsorships` (
            `SponsorshipId` varchar(36) NOT NULL,
            `EventId`       varchar(36) NOT NULL,
            `VendorId`      varchar(36) NOT NULL,
            `CompanyName`   varchar(255) NOT NULL,
            `LogoUrl`       longtext NULL,
            `Message`       varchar(500) NULL,
            `Amount`        decimal(12, 2) NOT NULL,
            `CreatedAt`     datetime(6) NOT NULL,
            PRIMARY KEY (`SponsorshipId`),
            KEY `IX_Sponsorships_EventId` (`EventId`)
        ) CHARACTER SET=utf8mb4;");
    Console.WriteLine("Sponsorships table ensured.");
}

static async Task SeedDemoSponsorshipsAsync(FinanceDbContext db)
{
    var demoSponsorships = new List<Sponsorship>
    {
        new()
        {
            SponsorshipId = "3e8b53f3-3c8b-4a83-b9ff-6a4a10000001",
            EventId = "8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001",
            VendorId = "6ee0f8b1-b2f5-4b8f-9d1d-710410000001",
            CompanyName = "Northstar Cloud",
            LogoUrl = "https://picsum.photos/seed/northstar-cloud/300/120",
            Message = "Proud to support India's next generation of product leaders.",
            Amount = 350000,
            CreatedAt = DateTime.UtcNow.AddDays(-14)
        },
        new()
        {
            SponsorshipId = "3e8b53f3-3c8b-4a83-b9ff-6a4a10000002",
            EventId = "8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001",
            VendorId = "6ee0f8b1-b2f5-4b8f-9d1d-710410000002",
            CompanyName = "Quantum Payments",
            LogoUrl = "https://picsum.photos/seed/quantum-payments/300/120",
            Message = "Seamless event commerce for modern communities.",
            Amount = 220000,
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        },
        new()
        {
            SponsorshipId = "3e8b53f3-3c8b-4a83-b9ff-6a4a10000003",
            EventId = "8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003",
            VendorId = "6ee0f8b1-b2f5-4b8f-9d1d-710410000003",
            CompanyName = "BlueHarbor Infra",
            LogoUrl = "https://picsum.photos/seed/blueharbor-infra/300/120",
            Message = "Partnering to build stronger event ecosystems.",
            Amount = 180000,
            CreatedAt = DateTime.UtcNow.AddMonths(-4)
        }
    };

    var existingIds = await db.Sponsorships
        .Select(s => s.SponsorshipId)
        .ToListAsync();

    var toInsert = demoSponsorships
        .Where(s => !existingIds.Contains(s.SponsorshipId))
        .ToList();

    if (toInsert.Count > 0)
    {
        db.Sponsorships.AddRange(toInsert);
        await db.SaveChangesAsync();
        Console.WriteLine($"Seeded {toInsert.Count} demo sponsorship records.");
    }
    else
    {
        Console.WriteLine("Demo sponsorship records already present.");
    }
}

// ----- Middleware Pipeline -----
app.UseMiddleware<ExceptionMiddleware>();
app.UseHttpMetrics();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger(c =>
    {
        c.RouteTemplate = "api/v1/payments/openapi/{documentName}.json";
    });
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/api/v1/payments/openapi/v1.json", "EventZen Finance Service v1");
        c.RoutePrefix = "api/v1/payments/docs";
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapMetrics("/metrics");

Console.WriteLine("EventZen Finance Service starting on port 8085...");
await app.RunAsync();
