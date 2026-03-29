import { useState } from "react";
import { motion } from "framer-motion";
import { Star, SmilePlus, CheckCircle, Ticket } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmojiRating from "@/components/ui/EmojiRating";
import RatingModal from "@/components/reviews/RatingModal";
import { useGetMyTicketsQuery } from "@/store/api/ticketApi";
import { useGetEventQuery } from "@/store/api/eventApi";
import { useGetMyReviewsQuery } from "@/store/api/reviewApi";
import { formatShortDate } from "@/utils/formatters";

const EMOJIS = ["", "😞", "😕", "😐", "😊", "🤩"];
const EMOJI_LABELS = ["", "Poor", "Fair", "Average", "Good", "Excellent"];

function hasReviewedEvent(eventId: string): boolean {
  try {
    const reviewed: string[] = JSON.parse(localStorage.getItem("eventzen_reviewed") || "[]");
    return reviewed.includes(eventId);
  } catch {
    return false;
  }
}

// Pending rating card for a completed event
function PendingRatingCard({ eventId, tickets }: { eventId: string; tickets: any[] }) {
  const [ratingOpen, setRatingOpen] = useState(false);
  const [reviewed, setReviewed] = useState(() => hasReviewedEvent(eventId));

  const { data: event } = useGetEventQuery(eventId, { skip: !eventId });
  const eventName = event?.title || tickets[0]?.eventTitle || "Event";
  const eventDate = event?.startDate || tickets[0]?.eventDate;
  const vendorId = event?.organizerId;
  const vendorName = event?.organizerName;

  if (reviewed) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-amber/20 rounded-2xl p-5 shadow-warm-md flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center flex-shrink-0">
            <Ticket size={22} className="text-amber" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-near-black">{eventName}</h3>
            <p className="font-body text-xs text-muted-gray mt-0.5">
              {eventDate ? formatShortDate(eventDate) : ""}
              {" · "}
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber/10 text-amber font-body text-[11px] font-semibold">
              <SmilePlus size={11} /> Awaiting your review
            </span>
          </div>
        </div>
        <Button onClick={() => setRatingOpen(true)} className="gap-2 shrink-0">
          <Star size={14} />
          Rate Now
        </Button>
      </motion.div>

      {ratingOpen && (
        <RatingModal
          eventId={eventId}
          eventTitle={eventName}
          vendorId={vendorId}
          vendorName={vendorName}
          onClose={() => setRatingOpen(false)}
          onSuccess={() => { setReviewed(true); setRatingOpen(false); }}
        />
      )}
    </>
  );
}

// Submitted review card
function ReviewCard({ review }: { review: any }) {
  const eventRating = review.eventRating ?? review.rating ?? 0;
  const vendorRating = review.vendorRating ?? 0;
  const platformRating = review.platformRating ?? 0;

  const eventId = review.eventId;
  const { data: event } = useGetEventQuery(eventId, { skip: !eventId });
  const eventName = event?.title || review.eventTitle || "Event";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border-light rounded-2xl p-5 shadow-warm-md space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold text-near-black">{eventName}</h3>
          {review.createdAt && (
            <p className="font-body text-xs text-muted-gray mt-0.5">
              Reviewed {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sage/10 text-sage font-body text-[11px] font-semibold">
          <CheckCircle size={11} /> Submitted
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Event", emoji: "🎉", rating: eventRating, comment: review.eventComment },
          { label: "Organizer", emoji: "🧑‍💼", rating: vendorRating, comment: review.vendorComment },
          { label: "EventZen", emoji: "⚡", rating: platformRating, comment: review.platformComment },
        ].map(({ label, emoji, rating, comment }) => (
          <div key={label} className="bg-cream rounded-xl p-3 text-center">
            <p className="font-accent text-[10px] uppercase tracking-wider text-muted-gray mb-1">{label}</p>
            <p className="text-2xl mb-1">{emoji}</p>
            <div className="flex items-center justify-center gap-1 mb-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} className={i < rating ? "text-amber fill-amber" : "text-border-light fill-border-light"} />
              ))}
            </div>
            <p className="font-body text-xs font-semibold text-near-black">
              {EMOJIS[rating] || "—"} {EMOJI_LABELS[rating] || "—"}
            </p>
            {comment && (
              <p className="font-body text-[10px] text-muted-gray mt-1.5 italic line-clamp-2">"{comment}"</p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MyReviewsPage() {
  const [tab, setTab] = useState<"pending" | "submitted">("pending");

  const { data: ticketsData, isLoading: ticketsLoading } = useGetMyTicketsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: myReviews, isLoading: reviewsLoading } = useGetMyReviewsQuery();

  // Extract tickets grouped by event
  const tickets: any[] = (() => {
    if (!ticketsData) return [];
    if (Array.isArray(ticketsData)) return ticketsData;
    for (const key of ["content", "data", "items", "tickets"]) {
      if (Array.isArray(ticketsData[key])) return ticketsData[key];
    }
    return [];
  })();

  // Group by eventId
  const ticketsByEvent: Record<string, any[]> = tickets.reduce((acc: any, t: any) => {
    const eid = t.eventId || "unknown";
    if (!acc[eid]) acc[eid] = [];
    acc[eid].push(t);
    return acc;
  }, {});

  // Only show completed events that haven't been reviewed yet
  const pendingEventIds = Object.keys(ticketsByEvent).filter(
    (eid) => eid !== "unknown" && !hasReviewedEvent(eid)
  );

  const reviews: any[] = Array.isArray(myReviews)
    ? myReviews
    : Array.isArray(myReviews?.content)
    ? myReviews.content
    : Array.isArray(myReviews?.data)
    ? myReviews.data
    : [];

  const isLoading = ticketsLoading || reviewsLoading;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            My Reviews
          </h1>
          <p className="font-body text-sm text-dark-gray">
            Rate events you attended — emoji scores + written feedback.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-cream rounded-xl border border-border-light mb-6">
          <button
            onClick={() => setTab("pending")}
            className={`flex-1 py-2 rounded-lg font-body text-sm font-medium transition-all ${
              tab === "pending"
                ? "bg-white text-near-black shadow-sm"
                : "text-muted-gray hover:text-near-black"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <SmilePlus size={15} />
              Pending
              {pendingEventIds.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber text-white font-accent text-[10px] font-bold flex items-center justify-center">
                  {pendingEventIds.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setTab("submitted")}
            className={`flex-1 py-2 rounded-lg font-body text-sm font-medium transition-all ${
              tab === "submitted"
                ? "bg-white text-near-black shadow-sm"
                : "text-muted-gray hover:text-near-black"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Star size={15} />
              Submitted
            </span>
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : tab === "pending" ? (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="bg-amber/5 border border-amber/20 rounded-xl p-4 flex items-start gap-3">
              <SmilePlus size={18} className="text-amber flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-body text-sm text-near-black font-medium">
                  Your voice matters!
                </p>
                <p className="font-body text-xs text-muted-gray mt-0.5">
                  Rate events you attended. Scores for Event, Organizer, and EventZen are mandatory (1–5 🌟). Comments are optional.
                </p>
              </div>
            </div>

            {pendingEventIds.length === 0 ? (
              <EmptyState
                icon={<Star size={28} />}
                title="All caught up!"
                description="You've reviewed all your attended events, or no completed events to rate yet."
              />
            ) : (
              pendingEventIds.map((eventId) => (
                <PendingRatingCard
                  key={eventId}
                  eventId={eventId}
                  tickets={ticketsByEvent[eventId]}
                />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <EmptyState
                icon={<Star size={28} />}
                title="No reviews yet"
                description="Your submitted reviews will appear here."
                action={{
                  label: "Rate an Event",
                  onClick: () => setTab("pending"),
                }}
              />
            ) : (
              reviews.map((r: any, i: number) => (
                <ReviewCard key={r.id || r.feedbackId || i} review={r} />
              ))
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
