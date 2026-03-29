using FinanceService.Infrastructure.Data;
using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceService.Services;

public interface IAdminRevenueService
{
    Task<object> GetAdminRevenueAsync();
}

public class AdminRevenueService(FinanceDbContext db, ILogger<AdminRevenueService> logger) : IAdminRevenueService
{
    private const decimal TicketCommissionRate  = 0.20m;
    private const decimal EventOrganizationFee  = 25000m;
    private const decimal VenueCommissionRate   = 0.25m;

    public async Task<object> GetAdminRevenueAsync()
    {
        // ── 1. Completed payments ────────────────────────────────────────────
        var allPayments = await db.Payments
            .Where(p => p.Status == PaymentStatus.COMPLETED)
            .ToListAsync();

        var totalTicketSales  = allPayments.Sum(p => p.Amount);
        var ticketCommission  = Math.Round(totalTicketSales * TicketCommissionRate, 2);

        // ── 2. Event organisation fee (one fee per event that has a budget) ──
        var budgets = await db.Budgets
            .Select(b => new { b.BudgetId, b.EventId, b.CreatedBy, b.Status, b.TotalEstimated, b.CreatedAt })
            .ToListAsync();

        var organizedEventIds = budgets.Select(b => b.EventId).Distinct().ToList();
        var uniqueEventCount  = organizedEventIds.Count;
        var eventFees         = uniqueEventCount * EventOrganizationFee;

        // ── 3. Venue commission ──────────────────────────────────────────────
        var allBudgetItems = await db.BudgetItems
            .Select(i => new { i.ItemId, i.BudgetId, i.Category, i.EstimatedAmount, i.ActualAmount, i.Description })
            .ToListAsync();

        var venueItems       = allBudgetItems.Where(i => i.Category == BudgetCategory.VENUE).ToList();
        var totalVenueBudget = venueItems.Sum(i => i.EstimatedAmount);
        var venueCommission  = Math.Round(totalVenueBudget * VenueCommissionRate, 2);

        var totalAdminRevenue = ticketCommission + eventFees + venueCommission;

        // ── 4. Per-event ticket revenue breakdown ────────────────────────────
        var eventPaymentBreakdown = allPayments
            .GroupBy(p => p.EventId)
            .Select(g => new
            {
                EventId      = g.Key,
                TicketRevenue = g.Sum(p => p.Amount),
                AdminCut     = Math.Round(g.Sum(p => p.Amount) * TicketCommissionRate, 2),
                PaymentCount = g.Count()
            })
            .OrderByDescending(e => e.TicketRevenue)
            .ToList();

        // ── 5. Sponsorship totals ────────────────────────────────────────────
        var sponsorships     = await db.Sponsorships.ToListAsync();
        var totalSponsorships = sponsorships.Sum(s => s.Amount);
        var sponsorshipCount  = sponsorships.Count;

        // ── 6. Per-vendor breakdown ──────────────────────────────────────────
        // Budget.CreatedBy == organizer userId
        var vendorBreakdown = budgets
            .GroupBy(b => b.CreatedBy)
            .Select(g =>
            {
                var vendorEventIds  = g.Select(b => b.EventId).Distinct().ToList();
                var vendorBudgetIds = g.Select(b => b.BudgetId).ToList();

                var venueCost   = venueItems
                    .Where(i => vendorBudgetIds.Contains(i.BudgetId))
                    .Sum(i => i.EstimatedAmount);

                var ticketRev   = allPayments
                    .Where(p => vendorEventIds.Contains(p.EventId))
                    .Sum(p => p.Amount);

                var evCount     = vendorEventIds.Count;
                var tCut        = Math.Round(ticketRev  * TicketCommissionRate, 2);
                var vCut        = Math.Round(venueCost   * VenueCommissionRate,  2);
                var fees        = evCount * EventOrganizationFee;

                return new
                {
                    VendorId          = g.Key,
                    EventCount        = evCount,
                    EventIds          = vendorEventIds,
                    TicketRevenue     = ticketRev,
                    TicketCommission  = tCut,
                    EventFees         = fees,
                    VenueBudget       = venueCost,
                    VenueCommission   = vCut,
                    TotalAdminCut     = tCut + fees + vCut
                };
            })
            .OrderByDescending(v => v.TotalAdminCut)
            .ToList();

        // ── 7. Venue budget per event ────────────────────────────────────────
        var budgetIdToEventId = budgets.ToDictionary(b => b.BudgetId, b => b.EventId);
        var budgetIdToCreator = budgets.ToDictionary(b => b.BudgetId, b => b.CreatedBy);

        var venueBudgetByEvent = venueItems
            .GroupBy(i => budgetIdToEventId.TryGetValue(i.BudgetId, out var eid) ? eid : "unknown")
            .Select(g => new
            {
                EventId        = g.Key,
                OrganizerId    = budgetIdToCreator.TryGetValue(
                                    venueItems.First(i => budgetIdToEventId.TryGetValue(i.BudgetId, out var id) && id == g.Key).BudgetId,
                                    out var cid) ? cid : "",
                VenueSpend     = g.Sum(i => i.EstimatedAmount),
                VenueCommission = Math.Round(g.Sum(i => i.EstimatedAmount) * VenueCommissionRate, 2),
                ItemCount      = g.Count()
            })
            .Where(v => v.VenueSpend > 0)
            .OrderByDescending(v => v.VenueSpend)
            .ToList();

        // ── 8. Event org fee per event ───────────────────────────────────────
        var eventOrgFeeByEvent = organizedEventIds
            .Select(eid => new
            {
                EventId     = eid,
                OrganizerId = budgets.FirstOrDefault(b => b.EventId == eid)?.CreatedBy ?? "",
                Fee         = EventOrganizationFee,
                BudgetStatus = budgets.FirstOrDefault(b => b.EventId == eid)?.Status.ToString() ?? ""
            })
            .ToList();

        // ── 9. Sponsorship by event ──────────────────────────────────────────
        var sponsorshipByEvent = sponsorships
            .GroupBy(s => s.EventId)
            .Select(g => new
            {
                EventId      = g.Key,
                SponsorCount = g.Count(),
                TotalAmount  = g.Sum(s => s.Amount),
                Sponsors     = g.Select(s => new
                {
                    s.CompanyName,
                    s.Amount,
                    s.VendorId
                }).ToList<object>()
            })
            .OrderByDescending(s => s.TotalAmount)
            .ToList();

        // ── 10. Budget category breakdown ────────────────────────────────────
        var categoryBreakdown = allBudgetItems
            .GroupBy(i => i.Category.ToString())
            .Select(g => new
            {
                Category       = g.Key,
                TotalEstimated = g.Sum(i => i.EstimatedAmount),
                TotalActual    = g.Sum(i => i.ActualAmount),
                ItemCount      = g.Count()
            })
            .OrderByDescending(c => c.TotalEstimated)
            .ToList();

        logger.LogInformation(
            "[AdminRevenue] Total ₹{Total} | Vendors: {Vendors} | Events: {Events}",
            totalAdminRevenue, vendorBreakdown.Count, uniqueEventCount);

        return new
        {
            // ── Summary ──────────────────────────────────────────────────────
            totalTicketSales,
            ticketCommissionRate     = TicketCommissionRate,
            ticketCommission,
            uniqueEventCount,
            eventOrganizationFeePerEvent = EventOrganizationFee,
            eventFees,
            totalVenueBudget,
            venueCommissionRate      = VenueCommissionRate,
            venueCommission,
            totalAdminRevenue,
            totalSponsorships,
            sponsorshipCount,
            generatedAt              = DateTime.UtcNow,

            // ── Detailed breakdowns ──────────────────────────────────────────
            eventPaymentBreakdown,   // per-event ticket revenue
            vendorBreakdown,         // per-vendor totals across all fee types
            venueBudgetByEvent,      // per-event venue spend + commission
            eventOrgFeeByEvent,      // per-event ₹25k org fee
            sponsorshipByEvent,      // per-event sponsorship detail
            categoryBreakdown        // budget spend by category
        };
    }
}
