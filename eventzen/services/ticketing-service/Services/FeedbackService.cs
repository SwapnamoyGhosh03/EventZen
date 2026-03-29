using MongoDB.Driver;
using TicketingService.DTOs;
using TicketingService.Infrastructure.MongoDB;
using TicketingService.Models;

namespace TicketingService.Services;

public class FeedbackService
{
    private readonly MongoDbContext _db;
    private readonly ILogger<FeedbackService> _logger;

    public FeedbackService(MongoDbContext db, ILogger<FeedbackService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Feedback> SubmitFeedbackAsync(string eventId, string attendeeId, FeedbackRequest request)
    {
        var existing = await _db.Feedbacks
            .Find(f => f.EventId == eventId && f.AttendeeId == attendeeId)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            var update = Builders<Feedback>.Update
                .Set(f => f.EventRating, request.EventRating)
                .Set(f => f.VendorRating, request.VendorRating)
                .Set(f => f.PlatformRating, request.PlatformRating)
                .Set(f => f.EventComment, request.EventComment)
                .Set(f => f.VendorComment, request.VendorComment)
                .Set(f => f.PlatformComment, request.PlatformComment)
                .Set(f => f.UpdatedAt, DateTime.UtcNow);

            await _db.Feedbacks.UpdateOneAsync(f => f.FeedbackId == existing.FeedbackId, update);

            existing.EventRating = request.EventRating;
            existing.VendorRating = request.VendorRating;
            existing.PlatformRating = request.PlatformRating;
            existing.EventComment = request.EventComment;
            existing.VendorComment = request.VendorComment;
            existing.PlatformComment = request.PlatformComment;
            existing.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation("Updated feedback {FeedbackId} for event {EventId}", existing.FeedbackId, eventId);
            return existing;
        }

        var feedback = new Feedback
        {
            EventId = eventId,
            AttendeeId = attendeeId,
            EventRating = request.EventRating,
            VendorRating = request.VendorRating,
            PlatformRating = request.PlatformRating,
            EventComment = request.EventComment,
            VendorComment = request.VendorComment,
            PlatformComment = request.PlatformComment
        };

        await _db.Feedbacks.InsertOneAsync(feedback);
        _logger.LogInformation("Submitted feedback {FeedbackId} for event {EventId}", feedback.FeedbackId, eventId);
        return feedback;
    }

    public async Task<object> GetFeedbackSummaryAsync(string eventId)
    {
        var feedbacks = await _db.Feedbacks
            .Find(f => f.EventId == eventId)
            .ToListAsync();

        var count = feedbacks.Count;
        if (count == 0)
            return new { averageRating = 0.0, averageVendorRating = 0.0, averagePlatformRating = 0.0, count = 0 };

        var avgEvent = Math.Round(feedbacks.Average(f => f.EventRating), 2);
        var avgVendor = Math.Round(feedbacks.Average(f => f.VendorRating), 2);
        var avgPlatform = Math.Round(feedbacks.Average(f => f.PlatformRating), 2);

        return new
        {
            averageRating = avgEvent,
            averageVendorRating = avgVendor,
            averagePlatformRating = avgPlatform,
            count
        };
    }

    public async Task<object> GetAggregatedFeedbackAsync(string eventId)
    {
        var feedbacks = await _db.Feedbacks
            .Find(f => f.EventId == eventId)
            .ToListAsync();

        var totalCount = feedbacks.Count;
        if (totalCount == 0)
        {
            return new
            {
                EventId = eventId,
                TotalResponses = 0,
                AverageEventRating = 0.0,
                AverageVendorRating = 0.0,
                AveragePlatformRating = 0.0,
                RecentComments = Array.Empty<object>()
            };
        }

        var avgEvent = Math.Round(feedbacks.Average(f => f.EventRating), 2);
        var avgVendor = Math.Round(feedbacks.Average(f => f.VendorRating), 2);
        var avgPlatform = Math.Round(feedbacks.Average(f => f.PlatformRating), 2);

        var recentComments = feedbacks
            .Where(f => !string.IsNullOrEmpty(f.EventComment))
            .OrderByDescending(f => f.CreatedAt)
            .Take(10)
            .Select(f => new
            {
                f.AttendeeId,
                f.EventComment,
                f.EventRating,
                f.VendorRating,
                f.PlatformRating,
                f.CreatedAt
            })
            .ToList<object>();

        return new
        {
            EventId = eventId,
            TotalResponses = totalCount,
            AverageEventRating = avgEvent,
            AverageVendorRating = avgVendor,
            AveragePlatformRating = avgPlatform,
            RecentComments = recentComments
        };
    }

    public async Task<IEnumerable<object>> GetEventReviewsAsync(string eventId)
    {
        var feedbacks = await _db.Feedbacks
            .Find(f => f.EventId == eventId)
            .SortByDescending(f => f.CreatedAt)
            .ToListAsync();

        return feedbacks.Select(f => (object)new
        {
            feedbackId = f.FeedbackId,
            eventId = f.EventId,
            eventRating = f.EventRating,
            vendorRating = f.VendorRating,
            platformRating = f.PlatformRating,
            eventComment = f.EventComment,
            vendorComment = f.VendorComment,
            platformComment = f.PlatformComment,
            isShowcased = f.IsShowcased,
            createdAt = f.CreatedAt
        });
    }

    public async Task<IEnumerable<object>> GetPublicReviewsAsync(string eventId)
    {
        var feedbacks = await _db.Feedbacks
            .Find(f => f.EventId == eventId && f.IsShowcased)
            .SortByDescending(f => f.CreatedAt)
            .ToListAsync();

        return feedbacks.Select(f => (object)new
        {
            eventRating = f.EventRating,
            vendorRating = f.VendorRating,
            eventComment = f.EventComment,
            createdAt = f.CreatedAt
        });
    }

    public async Task<bool> ToggleShowcaseAsync(string eventId, string feedbackId, bool showcase)
    {
        var update = Builders<Feedback>.Update
            .Set(f => f.IsShowcased, showcase)
            .Set(f => f.UpdatedAt, DateTime.UtcNow);

        var result = await _db.Feedbacks.UpdateOneAsync(
            f => f.EventId == eventId && f.FeedbackId == feedbackId,
            update);

        return result.ModifiedCount > 0;
    }

    public async Task<IEnumerable<object>> GetBulkSummariesAsync(IEnumerable<string> eventIds)
    {
        var ids = eventIds.ToList();
        if (!ids.Any())
            return Enumerable.Empty<object>();

        var feedbacks = await _db.Feedbacks
            .Find(f => ids.Contains(f.EventId))
            .ToListAsync();

        return ids.Select(eventId =>
        {
            var group = feedbacks.Where(f => f.EventId == eventId).ToList();
            var count = group.Count;
            if (count == 0)
                return (object)new { eventId, count = 0, avgEventRating = 0.0, avgVendorRating = 0.0, avgPlatformRating = 0.0 };
            return (object)new
            {
                eventId,
                count,
                avgEventRating = Math.Round(group.Average(f => f.EventRating), 2),
                avgVendorRating = Math.Round(group.Average(f => f.VendorRating), 2),
                avgPlatformRating = Math.Round(group.Average(f => f.PlatformRating), 2),
            };
        });
    }

    public async Task<IEnumerable<object>> GetMyFeedbackAsync(string attendeeId)
    {
        var feedbacks = await _db.Feedbacks
            .Find(f => f.AttendeeId == attendeeId)
            .SortByDescending(f => f.CreatedAt)
            .ToListAsync();

        return feedbacks.Select(f => (object)new
        {
            feedbackId = f.FeedbackId,
            eventId = f.EventId,
            eventRating = f.EventRating,
            vendorRating = f.VendorRating,
            platformRating = f.PlatformRating,
            eventComment = f.EventComment,
            vendorComment = f.VendorComment,
            platformComment = f.PlatformComment,
            createdAt = f.CreatedAt
        });
    }
}
