using FinanceService.DTOs;
using FinanceService.Infrastructure.Data;
using FinanceService.Middleware;
using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceService.Services;

public interface ISponsorshipService
{
    Task<Sponsorship> AddSponsorshipAsync(string eventId, string vendorId, CreateSponsorshipRequest request);
    Task<List<Sponsorship>> GetSponsorshipsAsync(string eventId);
}

public class SponsorshipService(FinanceDbContext db, ILogger<SponsorshipService> logger) : ISponsorshipService
{
    public async Task<Sponsorship> AddSponsorshipAsync(string eventId, string vendorId, CreateSponsorshipRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName))
            throw new FinanceException("FIN-4010", "Company name is required", 400);

        if (request.Amount <= 0)
            throw new FinanceException("FIN-4011", "Sponsorship amount must be greater than zero", 400);

        var sponsorship = new Sponsorship
        {
            EventId = eventId,
            VendorId = vendorId,
            CompanyName = request.CompanyName.Trim(),
            LogoUrl = request.LogoUrl,
            Message = request.Message,
            Amount = request.Amount
        };

        db.Sponsorships.Add(sponsorship);
        await db.SaveChangesAsync();

        logger.LogInformation("Sponsorship {Id} added by vendor {VendorId} for event {EventId}", sponsorship.SponsorshipId, vendorId, eventId);
        return sponsorship;
    }

    public async Task<List<Sponsorship>> GetSponsorshipsAsync(string eventId)
    {
        return await db.Sponsorships
            .Where(s => s.EventId == eventId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }
}
