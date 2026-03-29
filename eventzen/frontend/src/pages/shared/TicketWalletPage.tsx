import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Calendar, MapPin, Users, ChevronDown, ChevronUp, QrCode, Star, SmilePlus } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import RatingModal from "@/components/reviews/RatingModal";
import { useGetMyTicketsQuery } from "@/store/api/ticketApi";
import { useGetEventQuery } from "@/store/api/eventApi";
import { formatShortDate } from "@/utils/formatters";

function extractTickets(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload.content,
    payload.data,
    payload.items,
    payload.tickets,
    payload.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  if (payload.data && typeof payload.data === "object") {
    return extractTickets(payload.data);
  }

  return [];
}

// Format raw stored type values into human-readable names
function formatTierName(raw: string | undefined): string {
  if (!raw) return "General";
  const known: Record<string, string> = {
    GENERAL: "General",
    VIP: "VIP",
    SPEAKER: "Speaker",
    SPONSOR: "Sponsor",
    EARLY_BIRD: "Early Bird",
  };
  return known[raw.toUpperCase()] ?? raw;
}

function hasReviewedEvent(eventId: string): boolean {
  try {
    const reviewed: string[] = JSON.parse(localStorage.getItem("eventzen_reviewed") || "[]");
    return reviewed.includes(eventId);
  } catch {
    return false;
  }
}

// ── Per-event grouped card ───────────────────────────────────────────────────
function EventTicketGroup({ eventId, tickets }: { eventId: string; tickets: any[] }) {
  const [expanded, setExpanded] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [reviewed, setReviewed] = useState(() => hasReviewedEvent(eventId));

  const { data: event } = useGetEventQuery(eventId, {
    skip: !eventId || eventId === "unknown",
  });

  const eventName =
    event?.title ||
    tickets[0]?.eventTitle ||
    tickets[0]?.eventName ||
    "Event Ticket";
  const eventDate = event?.startDate || event?.date || tickets[0]?.eventDate;
  const eventCity = event?.city || tickets[0]?.eventCity;
  const ticketType = formatTierName(tickets[0]?.ticketType || tickets[0]?.type);
  const count = tickets.length;
  const isCompleted = event?.status === "COMPLETED";
  const vendorId = event?.organizerId;
  const vendorName = event?.organizerName;

  // Group pass URL — encodes HMAC-signed qrCodeData values so the group QR is check-in-ready
  const groupPassUrl =
    count > 1
      ? `/my/tickets/group?qrs=${encodeURIComponent(
          tickets.map((t) => t.qrCodeData || t.ticketId || t.id || "").join(",")
        )}&event=${eventId}&tier=${encodeURIComponent(ticketType)}`
      : "";
  const isCheckedIn = (status?: string) =>
    status === "USED" || status === "ALREADY_CHECKED_IN";
  const allCheckedIn = tickets.every((t) => isCheckedIn(t.status));
  const someCheckedIn = !allCheckedIn && tickets.some((t) => isCheckedIn(t.status));

  const statusVariant = allCheckedIn ? "success" : someCheckedIn ? "warning" : "neutral";
  const statusLabel = allCheckedIn
    ? count === 1 ? "Checked In" : "All Checked In"
    : someCheckedIn
    ? "Partially Checked In"
    : "Valid";

  // Rate button shown for completed events not yet reviewed
  const rateButton = isCompleted && !reviewed ? (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRatingOpen(true); }}
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber/10 text-amber border border-amber/20 font-body text-xs font-semibold hover:bg-amber/20 transition-colors"
    >
      <SmilePlus size={13} />
      Rate Event
    </button>
  ) : isCompleted && reviewed ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sage/10 text-sage font-body text-xs">
      <Star size={11} className="fill-sage" /> Rated
    </span>
  ) : null;

  // Single ticket: the whole card is a link
  if (count === 1) {
    const t = tickets[0];
    return (
      <div className="relative">
        <Link to={`/my/tickets/${t.ticketId || t.id}/pass`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white border border-border-light rounded-2xl overflow-hidden shadow-warm-md hover:shadow-warm-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Checked-in diagonal stamp */}
            {isCheckedIn(t.status) && (
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/8" />
                <div className="relative z-10 w-[145%] py-3 bg-burgundy/85 text-white text-xs font-bold tracking-[0.28em] uppercase text-center -rotate-[28deg] shadow-lg select-none">
                  ✓&nbsp;&nbsp;Checked In
                </div>
              </div>
            )}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber to-amber-dark" />
            <div className="pl-5 pr-5 py-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center flex-shrink-0">
                <QrCode size={22} className="text-amber" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg font-semibold text-near-black truncate mb-1">
                  {eventName}
                </h3>
                <div className="flex flex-wrap gap-3 mb-2">
                  {eventDate && (
                    <span className="flex items-center gap-1.5 text-sm font-body text-muted-gray">
                      <Calendar size={13} />
                      {formatShortDate(eventDate)}
                    </span>
                  )}
                  {eventCity && (
                    <span className="flex items-center gap-1.5 text-sm font-body text-muted-gray">
                      <MapPin size={13} />
                      {eventCity}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{ticketType}</Badge>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                  {rateButton}
                </div>
              </div>
              <span className="font-body text-xs text-amber shrink-0 mt-1">View Pass →</span>
            </div>
            {/* Ticket stub */}
            <div className="mx-5 border-t border-dashed border-border-light" />
            <div className="pl-5 pr-5 py-2.5 flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-gray">
                #{(t.ticketId || t.id || "").slice(0, 12).toUpperCase()}
              </span>
              <span className="font-body text-[11px] text-muted-gray">
                {t.createdAt ? formatShortDate(t.createdAt) : ""}
              </span>
            </div>
          </motion.div>
        </Link>

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
      </div>
    );
  }

  // Multiple tickets: stacked visual + expandable list
  return (
    <div className="relative">
      {/* Stack layers */}
      {count > 2 && (
        <div className="absolute top-3 left-2.5 right-2.5 bottom-0 bg-amber/5 border border-border-light rounded-2xl" />
      )}
      <div className="absolute top-1.5 left-1 right-1 bottom-0 bg-amber/10 border border-border-light rounded-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white border border-border-light rounded-2xl overflow-hidden shadow-warm-md"
      >
        {/* Checked-in diagonal stamp — only when every ticket in the group is used */}
        {allCheckedIn && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/8" />
            <div className="relative z-10 w-[145%] py-3 bg-burgundy/85 text-white text-xs font-bold tracking-[0.28em] uppercase text-center -rotate-[28deg] shadow-lg select-none">
              ✓&nbsp;&nbsp;All Checked In
            </div>
          </div>
        )}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber to-amber-dark" />

        {/* Header row — clickable to expand */}
        <button
          className="w-full text-left pl-5 pr-5 pt-5 pb-4"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center flex-shrink-0 relative">
              <QrCode size={22} className="text-amber" />
              {/* Count badge */}
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber text-white font-accent text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg font-semibold text-near-black truncate mb-1">
                {eventName}
              </h3>
              <div className="flex flex-wrap gap-3 mb-2">
                {eventDate && (
                  <span className="flex items-center gap-1.5 text-sm font-body text-muted-gray">
                    <Calendar size={13} />
                    {formatShortDate(eventDate)}
                  </span>
                )}
                {eventCity && (
                  <span className="flex items-center gap-1.5 text-sm font-body text-muted-gray">
                    <MapPin size={13} />
                    {eventCity}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{ticketType}</Badge>
                <span className="flex items-center gap-1 font-body text-xs text-muted-gray bg-cream px-2 py-0.5 rounded-full">
                  <Users size={11} />
                  {count} attendees
                </span>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
                {rateButton}
              </div>
            </div>

            <div className="flex flex-col items-center pt-1">
              {expanded ? (
                <ChevronUp size={18} className="text-muted-gray" />
              ) : (
                <ChevronDown size={18} className="text-muted-gray" />
              )}
            </div>
          </div>
        </button>

        {/* Expandable ticket list */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border-light">
                {/* Group pass CTA at the top of the expanded list */}
                <div className="flex items-center justify-between px-5 py-3 bg-amber/5 border-b border-border-light">
                  <span className="flex items-center gap-1.5 font-body text-xs text-dark-gray">
                    <QrCode size={13} className="text-amber" />
                    Combined QR for all {count} tickets
                  </span>
                  <Link
                    to={groupPassUrl}
                    className="font-body text-xs text-amber font-semibold hover:underline"
                  >
                    View Group Pass →
                  </Link>
                </div>
                {tickets.map((t, i) => (
                  <Link
                    key={t.ticketId || t.id}
                    to={`/my/tickets/${t.ticketId || t.id}/pass`}
                    className="flex items-center gap-4 pl-5 pr-5 py-3.5 border-b last:border-0 border-border-light hover:bg-cream/60 transition-colors"
                  >
                    {/* Attendee number */}
                    <div className="w-7 h-7 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-accent text-[11px] font-bold text-amber">
                        {i + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-near-black">
                        Attendee {i + 1}
                      </p>
                      <p className="font-mono text-[11px] text-muted-gray">
                        #{(t.ticketId || t.id || "").slice(0, 12).toUpperCase()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="info">
                        {formatTierName(t.ticketType || t.type)}
                      </Badge>
                      <Badge
                        variant={isCheckedIn(t.status) ? "success" : "neutral"}
                      >
                        {isCheckedIn(t.status) ? "Checked In" : "Valid"}
                      </Badge>
                      <span className="text-amber text-xs font-body">Pass →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed summary stub */}
        {!expanded && (
          <>
            <div className="mx-5 border-t border-dashed border-border-light" />
            <div className="pl-5 pr-5 py-2.5 flex items-center justify-between">
              <span className="font-body text-[11px] text-muted-gray">
                {count} ticket{count !== 1 ? "s" : ""} · tap to expand
              </span>
              <Link
                to={groupPassUrl}
                className="font-body text-[11px] text-amber hover:underline"
              >
                Group Pass →
              </Link>
            </div>
          </>
        )}
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
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TicketWalletPage() {
  const { data, error, isLoading, isError } = useGetMyTicketsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const tickets: any[] = extractTickets(data);
  const apiErrorMessage =
    (error as any)?.data?.error?.message ||
    (error as any)?.data?.message ||
    ((error as any)?.status ? `Request failed (${(error as any).status})` : "");

  // Group by eventId + ticketTypeId so different tiers appear as separate cards
  const grouped = tickets.reduce((acc: Record<string, any[]>, t: any) => {
    const tier = t.ticketTypeId || t.ticketType || "GENERAL";
    const key = `${t.eventId || "unknown"}|${tier}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const groupEntries = Object.entries(grouped);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black">
            My Tickets
          </h1>
          <div className="flex items-center gap-3">
            {tickets.length > 0 && (
              <span className="font-body text-sm text-muted-gray bg-cream px-3 py-1 rounded-full border border-border-light">
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              </span>
            )}
            <Link
              to="/my/reviews"
              className="inline-flex items-center gap-1.5 font-body text-sm text-amber hover:underline"
            >
              <Star size={14} className="fill-amber" />
              My Reviews
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<Ticket size={28} />}
            title="Unable to Load Tickets"
            description={
              apiErrorMessage
                ? `We could not fetch your latest tickets. ${apiErrorMessage}`
                : "We could not fetch your latest tickets right now. Please refresh and try again."
            }
            action={{
              label: "Retry",
              onClick: () => window.location.reload(),
            }}
          />
        ) : groupEntries.length === 0 ? (
          <EmptyState
            icon={<Ticket size={28} />}
            title="No Tickets Yet"
            description="Register for an event to get your first ticket."
            action={{
              label: "Browse Events",
              onClick: () => (window.location.href = "/events"),
            }}
          />
        ) : (
          <div className="space-y-6">
            {groupEntries.map(([groupKey, eventTickets]) => {
              const [eventId] = groupKey.split("|");
              return (
                <EventTicketGroup
                  key={groupKey}
                  eventId={eventId}
                  tickets={eventTickets}
                />
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
