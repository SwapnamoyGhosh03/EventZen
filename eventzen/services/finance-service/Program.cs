using System.Text.Json.Serialization;
using FinanceService.Infrastructure.Auth;
using FinanceService.Infrastructure.Data;
using FinanceService.Infrastructure.Kafka;
using FinanceService.Middleware;
using FinanceService.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
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

// ----- Auto-apply Migrations -----
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    try
    {
        // If no migration files exist, EnsureCreatedAsync creates schema from model directly
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
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: DB setup failed: {ex.Message}");
    }

    // Ensure tables added after initial schema creation exist (no-op if already present)
    try
    {
        var db2 = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
        await db2.Database.ExecuteSqlRawAsync(@"
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
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: Sponsorships table ensure failed: {ex.Message}");
    }
}

// ----- Middleware Pipeline -----
app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "EventZen Finance Service v1");
    c.RoutePrefix = "swagger";
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("EventZen Finance Service starting on port 8085...");
await app.RunAsync();
