using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Prometheus;
using TicketingService.Infrastructure.Auth;
using TicketingService.Infrastructure.Kafka;
using TicketingService.Infrastructure.MongoDB;
using TicketingService.Infrastructure.Redis;
using TicketingService.Middleware;
using TicketingService.Services;

var builder = WebApplication.CreateBuilder(args);

// ── MongoDB ──────────────────────────────────────────────
builder.Services.AddSingleton<MongoDbContext>();

// ── Redis ────────────────────────────────────────────────
builder.Services.AddSingleton<RedisService>();

// ── Kafka ────────────────────────────────────────────────
builder.Services.AddSingleton<KafkaProducer>();

// ── Application Services ─────────────────────────────────
builder.Services.AddSingleton<QrCodeService>();
builder.Services.AddSingleton<TicketService>();
builder.Services.AddSingleton<WaitlistService>();
builder.Services.AddSingleton<FeedbackService>();
builder.Services.AddSingleton<CheckinService>();
builder.Services.AddSingleton<RegistrationService>();

// ── JWT Authentication ───────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is not configured");

builder.Services.AddAuthentication("JwtAuth")
    .AddScheme<JwtAuthOptions, JwtAuthHandler>("JwtAuth", options =>
    {
        options.Secret = jwtSecret;
        options.Issuer = jwtIssuer;
    });

builder.Services.AddAuthorization();

// ── Controllers ──────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ── Swagger ──────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EventZen Ticketing Service",
        Version = "v1",
        Description = "Attendee & Ticketing Service for EventZen platform"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
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

// ── CORS ─────────────────────────────────────────────────
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

// ── Configure MongoDB Indexes ────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await dbContext.ConfigureIndexesAsync();
}

// ── Middleware Pipeline ──────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<IdempotencyMiddleware>();

app.UseHttpMetrics();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapMetrics("/metrics");

// ── Health Endpoint ──────────────────────────────────────
app.MapGet("/api/v1/health", () => Results.Ok(new
{
    Success = true,
    Data = new
    {
        Status = "healthy",
        Service = "ticketing-service",
        Timestamp = DateTime.UtcNow.ToString("o")
    }
})).AllowAnonymous();

await app.RunAsync();
