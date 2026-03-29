import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MapPin, Users, Clock, ArrowLeft, ChevronLeft, ChevronRight,
  X, Share2, Check, Zap, Tag, Mic2, BookOpen, Info, ExternalLink,
  ChevronDown, ChevronUp, Building2, Star, Handshake,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EventStatusBadge from "@/components/events/EventStatusBadge";
import FeedbackForm from "@/components/tickets/FeedbackForm";
import Skeleton from "@/components/ui/Skeleton";
import { useGetEventQuery } from "@/store/api/eventApi";
import { useGetTicketTypesQuery } from "@/store/api/ticketApi";
import { useGetPublicReviewsQuery, useGetReviewSummaryQuery } from "@/store/api/reviewApi";
import { useGetSponsorshipsQuery } from "@/store/api/paymentApi";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { useAuthContext } from "@/context/AuthContext";

// ─── helpers ──────────────────────────────────────────────────────────────────
const TAX_RATE = 0.10;

function fmtTime(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return iso; }
}

function fmtDay(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

function dayKey(iso: string) {
  if (!iso) return "TBD";
  try { return new Date(iso).toISOString().slice(0, 10); }
  catch { return iso; }
}

const SESSION_TYPE_COLOR: Record<string, string> = {
  // Conferences / talks
  KEYNOTE: "bg-amber/10 text-amber border-amber/30",
  PANEL: "bg-dusty-blue/10 text-dusty-blue border-dusty-blue/30",
  WORKSHOP: "bg-sage/10 text-sage border-sage/30",
  BREAKOUT: "bg-blush/30 text-burgundy border-burgundy/20",
  NETWORKING: "bg-purple-50 text-purple-600 border-purple-200",
  PRESENTATION: "bg-cream text-dark-gray border-border-light",
  "Q&A": "bg-teal-50 text-teal-600 border-teal-200",
  LIGHTNING: "bg-orange-50 text-orange-600 border-orange-200",
  // Music / concerts
  PERFORMANCE: "bg-pink-50 text-pink-600 border-pink-200",
  "LIVE MUSIC": "bg-pink-50 text-pink-600 border-pink-200",
  "DJ SET": "bg-violet-50 text-violet-600 border-violet-200",
  CONCERT: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  SET: "bg-violet-50 text-violet-600 border-violet-200",
  // Film / screenings
  SCREENING: "bg-indigo-50 text-indigo-600 border-indigo-200",
  "FILM SCREENING": "bg-indigo-50 text-indigo-600 border-indigo-200",
  PREMIERE: "bg-indigo-50 text-indigo-700 border-indigo-300",
  // Food / cooking
  "COOKING DEMO": "bg-lime-50 text-lime-700 border-lime-200",
  "TASTING SESSION": "bg-lime-50 text-lime-700 border-lime-200",
  MASTERCLASS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  // Sports / fitness
  "WARM UP": "bg-orange-50 text-orange-600 border-orange-200",
  MATCH: "bg-green-50 text-green-700 border-green-200",
  RACE: "bg-red-50 text-red-600 border-red-200",
  // Generic
  BREAK: "bg-gray-50 text-gray-500 border-gray-200",
  CEREMONY: "bg-amber/10 text-amber border-amber/30",
  OPENING: "bg-amber/10 text-amber border-amber/30",
  CLOSING: "bg-gray-100 text-gray-600 border-gray-200",
  SESSION: "bg-cream text-dark-gray border-border-light",
};

function sessionTypeColor(raw: string | undefined | null): string {
  if (!raw) return "bg-cream text-dark-gray border-border-light";
  return (
    SESSION_TYPE_COLOR[raw.toUpperCase()] ??
    SESSION_TYPE_COLOR[raw] ??
    "bg-cream text-dark-gray border-border-light"
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-7 bg-amber rounded-full flex-shrink-0" />
      <div className="flex items-center gap-2 text-near-black">
        <span className="text-amber">{icon}</span>
        <h2 className="font-heading text-xl font-bold">{children}</h2>
      </div>
    </div>
  );
}

// ─── Agenda section ────────────────────────────────────────────────────────────
function AgendaSection({ sessions }: { sessions: any[] }) {
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());

  // Group by day
  const byDay: Record<string, any[]> = {};
  sessions.forEach((s) => {
    const k = dayKey(s.startTime);
    if (!byDay[k]) byDay[k] = [];
    byDay[k].push(s);
  });
  const dayEntries = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));

  // Auto-open first day
  useEffect(() => {
    if (dayEntries.length > 0) setOpenDays(new Set([dayEntries[0][0]]));
  }, [sessions.length]);

  if (sessions.length === 0) {
    return (
      <div className="py-6 text-center bg-cream/50 rounded-xl border border-border-light">
        <BookOpen size={24} className="mx-auto text-muted-gray mb-2" />
        <p className="font-body text-sm text-muted-gray">Agenda will be announced soon.</p>
      </div>
    );
  }

  const toggle = (k: string) =>
    setOpenDays((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  return (
    <div className="space-y-3">
      {dayEntries.map(([dk, daySessions], dayIdx) => {
        const open = openDays.has(dk);
        return (
          <div key={dk} className="border border-border-light rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-cream/60 hover:bg-cream transition-colors"
              onClick={() => toggle(dk)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber text-white flex items-center justify-center font-heading text-sm font-bold flex-shrink-0">
                  {dayIdx + 1}
                </div>
                <div className="text-left">
                  <p className="font-body text-[10px] uppercase tracking-widest text-muted-gray">
                    DAY {dayIdx + 1}
                  </p>
                  <p className="font-heading text-sm font-semibold text-near-black">
                    {dk === "TBD" ? "Date TBD" : fmtDay(daySessions[0]?.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-muted-gray bg-white border border-border-light rounded-full px-2.5 py-0.5">
                  {daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
                </span>
                {open ? <ChevronUp size={16} className="text-muted-gray" /> : <ChevronDown size={16} className="text-muted-gray" />}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="sessions"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-border-light">
                    {daySessions.map((s: any, i: number) => (
                      <div key={s.sessionId || i} className="px-5 py-4 flex gap-4 hover:bg-cream/30 transition-colors">
                        {/* Time column */}
                        <div className="w-20 flex-shrink-0 text-right pt-0.5">
                          {s.startTime && (
                            <p className="font-mono text-xs font-semibold text-amber">{fmtTime(s.startTime)}</p>
                          )}
                          {s.endTime && (
                            <p className="font-mono text-[10px] text-muted-gray">{fmtTime(s.endTime)}</p>
                          )}
                        </div>
                        {/* Connector dot */}
                        <div className="flex flex-col items-center pt-1 flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber border-2 border-white shadow" />
                          {i < daySessions.length - 1 && (
                            <div className="w-px flex-1 bg-border-light mt-1" />
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-heading text-sm font-semibold text-near-black">{s.title}</p>
                            {s.sessionType && (
                              <span className={`font-body text-[10px] px-2 py-0.5 rounded-full border ${sessionTypeColor(s.sessionType)}`}>
                                {s.sessionType}
                              </span>
                            )}
                          </div>
                          {s.description && (
                            <p className="font-body text-xs text-dark-gray leading-relaxed mb-2">{s.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-[11px] text-muted-gray font-body">
                            {s.location && (
                              <span className="flex items-center gap-1">
                                <MapPin size={10} /> {s.location}
                              </span>
                            )}
                            {s.capacity && (
                              <span className="flex items-center gap-1">
                                <Users size={10} /> {s.capacity} seats
                              </span>
                            )}
                            {s.speakerName && (
                              <span className="flex items-center gap-1 text-amber font-medium">
                                <Mic2 size={10} /> {s.speakerName}
                                {s.speakerRole && <span className="text-muted-gray font-normal">· {s.speakerRole}</span>}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Speakers section ──────────────────────────────────────────────────────────
function SpeakersSection({ sessions }: { sessions: any[] }) {

  const speakerMap: Record<string, any> = {};
  sessions.forEach((s) => {
    if (s.speakerName && !speakerMap[s.speakerName]) {
      speakerMap[s.speakerName] = {
        name: s.speakerName,
        role: s.speakerRole,
        company: s.speakerCompany,
        photo: s.speakerPhotoUrl,
        profile: s.speakerProfileLink,
      };
    }
  });
  const speakers = Object.values(speakerMap);

  if (speakers.length === 0) {
    return (
      <div className="py-6 text-center bg-cream/50 rounded-xl border border-border-light">
        <Mic2 size={24} className="mx-auto text-muted-gray mb-2" />
        <p className="font-body text-sm text-muted-gray">Speaker lineup will be announced soon.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {speakers.map((sp) => (
        <div key={sp.name} className="flex items-start gap-3 p-4 bg-white border border-border-light rounded-xl hover:border-amber/40 hover:shadow-warm-sm transition-all">
          {sp.photo ? (
            <img src={sp.photo} alt={sp.name} className="w-12 h-12 rounded-full object-cover border border-border-light flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0">
              <span className="font-heading text-lg font-bold text-amber">
                {sp.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <p className="font-heading text-sm font-semibold text-near-black leading-tight">{sp.name}</p>
              {sp.profile && (
                <a href={sp.profile} target="_blank" rel="noopener noreferrer" className="text-muted-gray hover:text-amber flex-shrink-0 mt-0.5">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            {sp.role && <p className="font-body text-xs text-muted-gray mt-0.5">{sp.role}</p>}
            {sp.company && (
              <p className="font-body text-[11px] text-amber mt-0.5 flex items-center gap-1">
                <Building2 size={10} /> {sp.company}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Ticket sidebar ────────────────────────────────────────────────────────────
function TicketSidebar({ tickets, eventId, event }: { tickets: any[]; eventId: string; event: any }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const setQty = (id: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const cur = prev[id] ?? 0;
      const next = Math.max(0, Math.min(max, cur + delta));
      return { ...prev, [id]: next };
    });
  };

  const hasSelections = Object.values(quantities).some((q) => q > 0);

  const subtotal = tickets.reduce((sum, tt) => {
    const qty = quantities[tt.ticketTypeId || tt.id] ?? 0;
    return sum + (tt.price ?? 0) * qty;
  }, 0);

  const taxes = subtotal > 0 ? Math.round(subtotal * TAX_RATE * 100) / 100 : 0;
  const total = subtotal + taxes;

  function handleRegister() {
    if (!isAuthenticated) { navigate("/auth"); return; }
    const items = Object.entries(quantities)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => `${id}:${q}`)
      .join(",");
    if (!items) return;
    navigate(`/events/${eventId}/checkout?items=${encodeURIComponent(items)}`);
  }

  const seatMapUrl = tickets.find((tt: any) => tt.seatMapImageUrl)?.seatMapImageUrl;

  if (tickets.length === 0) {
    return (
      <div className="bg-white border border-border-light rounded-2xl p-6 text-center">
        <p className="font-body text-sm text-muted-gray">No tickets available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border-light rounded-2xl overflow-hidden shadow-warm-md">
      {/* Seating / pricing chart */}
      {seatMapUrl && (
        <div className="px-4 pt-4 pb-3 border-b border-border-light">
          <p className="font-body text-[11px] text-muted-gray uppercase tracking-wide mb-2">Seating / Pricing Chart</p>
          <img
            src={seatMapUrl}
            alt="Seating chart"
            className="w-full rounded-lg border border-border-light object-contain max-h-36"
          />
        </div>
      )}
      {/* Ticket list */}
      <div className="divide-y divide-border-light">
        {tickets.map((tt) => {
          const id = tt.ticketTypeId || tt.id;
          const qty = quantities[id] ?? 0;
          const max = Math.min(tt.maxPerUser || 10, tt.availableQuantity || 99);
          const isSoldOut = (tt.availableQuantity ?? 1) <= 0;
          const isSelected = qty > 0;

          return (
            <div
              key={id}
              className={`p-4 transition-colors ${isSelected ? "bg-amber/5 border-l-2 border-amber" : ""}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-heading text-sm font-semibold text-near-black">{tt.name}</p>
                    {isSelected && (
                      <span className="font-body text-[10px] bg-amber text-white px-1.5 py-0.5 rounded font-bold tracking-wider">
                        SELECTED
                      </span>
                    )}
                    {isSoldOut && (
                      <span className="font-body text-[10px] bg-burgundy/10 text-burgundy px-1.5 py-0.5 rounded border border-burgundy/20">
                        SOLD OUT
                      </span>
                    )}
                  </div>
                  {tt.description && (
                    <p className="font-body text-xs text-muted-gray mt-0.5 leading-relaxed">{tt.description}</p>
                  )}
                </div>
                <p className="font-heading text-sm font-bold text-near-black flex-shrink-0">
                  {tt.price === 0 ? "Free" : formatCurrency(tt.price)}
                </p>
              </div>

              {/* Qty control */}
              {!isSoldOut && (
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setQty(id, -1, max)}
                    disabled={qty <= 0}
                    className="w-7 h-7 rounded-full border-2 border-border-light flex items-center justify-center font-bold text-near-black hover:border-amber transition-colors disabled:opacity-30 text-sm"
                  >
                    −
                  </button>
                  <span className="font-heading text-base font-bold text-near-black w-5 text-center tabular-nums">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(id, +1, max)}
                    disabled={qty >= max}
                    className="w-7 h-7 rounded-full border-2 border-border-light flex items-center justify-center font-bold text-near-black hover:border-amber transition-colors disabled:opacity-30 text-sm"
                  >
                    +
                  </button>
                  {qty > 0 && (
                    <span className="font-body text-xs text-dark-gray ml-auto">
                      = {tt.price === 0 ? "Free" : formatCurrency(tt.price * qty)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Price breakdown */}
      {hasSelections && (
        <div className="px-5 py-4 bg-cream/50 border-t border-border-light space-y-2">
          <div className="flex justify-between font-body text-sm text-dark-gray">
            <span>Subtotal</span>
            <span>{subtotal === 0 ? "Free" : formatCurrency(subtotal)}</span>
          </div>
          {taxes > 0 && (
            <div className="flex justify-between font-body text-sm text-muted-gray">
              <span>Taxes & Fees (10%)</span>
              <span>{formatCurrency(taxes)}</span>
            </div>
          )}
          <div className="flex justify-between font-heading text-base font-bold text-near-black pt-2 border-t border-border-light">
            <span>Total</span>
            <span className="text-amber">{total === 0 ? "Free" : formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-5 py-4 space-y-3">
        {event.status === "REGISTRATION_OPEN" ? (
          <Button
            variant="primary"
            className="w-full justify-center"
            disabled={!hasSelections}
            onClick={handleRegister}
          >
            Register Now
          </Button>
        ) : (
          <div className="text-center">
            <span className="font-body text-sm text-muted-gray">
              {event.status === "COMPLETED" ? "Event has ended" : "Registration not open yet"}
            </span>
          </div>
        )}

        {event.refundPolicy && (
          <p className="font-body text-[10px] text-center text-muted-gray uppercase tracking-wider">
            {event.refundPolicy}
          </p>
        )}
      </div>

      {/* Help box */}
      <div className="mx-4 mb-4 p-3 bg-dusty-blue/5 border border-dusty-blue/20 rounded-xl">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-dusty-blue mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-body text-xs font-semibold text-near-black mb-0.5">Need help?</p>
            <p className="font-body text-[11px] text-dark-gray leading-relaxed">
              Contact our support team.
            </p>
            <p className="font-body text-[10px] text-muted-gray mt-1">
              <span className="font-medium">Note:</span> For paid tickets, you'll receive email notifications about registration status and payment updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthContext();
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "agenda" | "speakers" | "reviews" | "sponsors">("about");

  const { data: event, isLoading } = useGetEventQuery(id!);
  const { data: ticketTypes } = useGetTicketTypesQuery(id!);
  const { data: publicReviewsData } = useGetPublicReviewsQuery(id!, { skip: !id });
  const { data: reviewSummary } = useGetReviewSummaryQuery(id!, { skip: !id });
  const { data: sponsorships } = useGetSponsorshipsQuery(id!);

  // Countdown
  const calcTimeLeft = (target: string) => {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  const [timeLeft, setTimeLeft] = useState(() =>
    event?.startDate ? calcTimeLeft(event.startDate) : null
  );
  useEffect(() => {
    if (!event?.startDate) return;
    const t = setInterval(() => setTimeLeft(calcTimeLeft(event.startDate)), 1000);
    return () => clearInterval(t);
  }, [event?.startDate]);

  if (isLoading) {
    return (
      <div className="section-cream section-padding">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton variant="rectangular" height={340} className="w-full rounded-2xl" />
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-4">
              <Skeleton width="70%" height={36} />
              <Skeleton width="50%" />
              <Skeleton height={120} />
            </div>
            <Skeleton height={400} />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="section-cream section-padding text-center">
        <h1 className="font-heading text-2xl text-near-black mb-4">Event Not Found</h1>
        <Link to="/events"><Button variant="primary">Back to Events</Button></Link>
      </div>
    );
  }

  const tickets = ticketTypes?.content || ticketTypes || [];
  const feedbackList = Array.isArray(publicReviewsData) ? publicReviewsData : Array.isArray(publicReviewsData?.content) ? publicReviewsData.content : [];
  const images: string[] = event.imageUrls?.length > 0
    ? event.imageUrls
    : event.bannerUrl ? [event.bannerUrl] : [];

  const spotsLeft = event.maxCapacity && event.currentRegistrations != null
    ? event.maxCapacity - event.currentRegistrations : null;
  const fillPct = event.maxCapacity && event.currentRegistrations != null
    ? Math.min((event.currentRegistrations / event.maxCapacity) * 100, 100) : 0;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const minPrice = tickets.reduce((min: number | null, tt: any) =>
    min === null ? tt.price : Math.min(min, tt.price), null);

  return (
    <PageTransition>
      {/* Hero image — full width */}
      <div className="bg-near-black">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 font-body text-sm text-white/60 hover:text-amber transition-colors mb-4"
          >
            <ArrowLeft size={15} /> Back to Events
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div
              className="h-64 md:h-[380px] bg-gradient-to-br from-amber/30 to-blush/20 flex items-center justify-center cursor-pointer group"
              onClick={() => images.length > 0 && setLightboxOpen(true)}
            >
              {images.length > 0 ? (
                <img
                  src={images[galleryIndex]}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <span className="text-8xl opacity-20">&#127879;</span>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + images.length) % images.length); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % images.length); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); setGalleryIndex(i); }}
                        className={`w-2 h-2 rounded-full transition-colors ${i === galleryIndex ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 pb-3 overflow-x-auto">
              {images.map((src, i) => (
                <button key={i} onClick={() => setGalleryIndex(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === galleryIndex ? "border-amber" : "border-white/20 hover:border-white/50"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}>
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
              <X size={20} />
            </button>
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + images.length) % images.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center">
                  <ChevronLeft size={22} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % images.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center">
                  <ChevronRight size={22} />
                </button>
              </>
            )}
            <img src={images[galleryIndex]} alt={event.title} className="max-w-full max-h-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <section className="section-cream section-padding">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

            {/* ── Left column ── */}
            <div className="space-y-8 min-w-0">

              {/* Title + meta */}
              <div>
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <EventStatusBadge status={event.status} publicView />
                  {event.categoryName && (
                    <span className="font-body text-xs bg-amber/10 text-amber px-3 py-1 rounded-full border border-amber/20 uppercase tracking-wider font-semibold">
                      {event.categoryName}
                    </span>
                  )}
                  {event.eventType && (
                    <span className="font-body text-xs bg-cream text-dark-gray px-3 py-1 rounded-full border border-border-light uppercase tracking-wider font-semibold">
                      {event.eventType}
                    </span>
                  )}
                  {event.tags?.map((tag: string) => (
                    <span key={tag} className="font-body text-xs bg-blush/30 text-burgundy px-3 py-1 rounded-full border border-burgundy/15 uppercase tracking-wider font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-4 leading-tight">
                  {event.title}
                </h1>

                {/* Meta strip */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
                  {event.startDate && (
                    <div className="flex items-center gap-1.5 font-body text-sm text-dark-gray">
                      <Calendar size={14} className="text-amber" />
                      {formatDate(event.startDate)}
                      {event.endDate && event.endDate !== event.startDate && (
                        <> &mdash; {formatDate(event.endDate)}</>
                      )}
                    </div>
                  )}
                  {event.city && (
                    <div className="flex items-center gap-1.5 font-body text-sm text-dark-gray">
                      <MapPin size={14} className="text-amber" />
                      {event.city}
                      {event.address && <span className="text-muted-gray">, {event.address}</span>}
                    </div>
                  )}
                  {event.currentRegistrations != null && (
                    <div className="flex items-center gap-1.5 font-body text-sm text-dark-gray">
                      <Users size={14} className="text-amber" />
                      {event.currentRegistrations} Attending
                    </div>
                  )}
                  {minPrice !== null && (
                    <div className="flex items-center gap-1.5 font-body text-sm text-dark-gray">
                      <Tag size={14} className="text-amber" />
                      {minPrice === 0 ? "Free" : `From ${formatCurrency(minPrice)}`}
                    </div>
                  )}
                </div>

                {/* Capacity bar */}
                {event.maxCapacity && (
                  <div className="bg-white border border-border-light rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-body text-xs font-semibold text-near-black uppercase tracking-wider">
                        TICKET CAPACITY
                      </span>
                      <span className={`font-body text-xs font-bold px-2 py-0.5 rounded-full ${fillPct > 85 ? "bg-burgundy/10 text-burgundy" : fillPct > 60 ? "bg-amber/10 text-amber" : "bg-sage/10 text-sage"}`}>
                        {Math.round(fillPct)}% Filled
                      </span>
                    </div>
                    <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${fillPct > 85 ? "bg-burgundy" : fillPct > 60 ? "bg-amber" : "bg-sage"}`}
                      />
                    </div>
                    <p className="font-body text-xs text-muted-gray mt-2">
                      {spotsLeft !== null && spotsLeft <= 0
                        ? "This event is fully booked."
                        : spotsLeft !== null && spotsLeft <= 30
                          ? `Only ${spotsLeft} spots remaining — register now!`
                          : `${event.currentRegistrations ?? 0} of ${event.maxCapacity} seats filled`}
                    </p>
                  </div>
                )}
              </div>

              {/* Countdown */}
              {timeLeft && (
                <div className="bg-gradient-to-br from-near-black to-[#2a1a0e] rounded-xl p-6 text-white">
                  <p className="font-body text-xs uppercase tracking-widest text-amber mb-4 flex items-center gap-2">
                    <Zap size={12} className="text-amber" /> Event starts in
                  </p>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {[{ v: timeLeft.days, label: "Days" }, { v: timeLeft.hours, label: "Hours" }, { v: timeLeft.minutes, label: "Mins" }, { v: timeLeft.seconds, label: "Secs" }].map(({ v, label }) => (
                      <div key={label} className="bg-white/10 rounded-xl py-3 px-2">
                        <p className="font-heading text-3xl font-bold text-white tabular-nums">{String(v).padStart(2, "0")}</p>
                        <p className="font-body text-[10px] text-white/60 uppercase tracking-wider mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tabbed sections ── */}
              <div>
                {/* Tab bar */}
                <div className="flex items-center gap-1 border-b border-border-light mb-6">
                  {(
                    [
                      { key: "about", icon: <BookOpen size={14} />, label: "About" },
                      { key: "agenda", icon: <Calendar size={14} />, label: "Agenda" },
                      { key: "speakers", icon: <Mic2 size={14} />, label: "Speakers" },
                      { key: "reviews", icon: <Star size={14} />, label: "Reviews" },
                      { key: "sponsors", icon: <Handshake size={14} />, label: (sponsorships || []).length > 0 ? `Sponsors (${(sponsorships || []).length})` : "Sponsors" },
                    ] as { key: "about" | "agenda" | "speakers" | "reviews" | "sponsors"; icon: React.ReactNode; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 font-body text-sm font-medium border-b-2 -mb-px transition-colors ${
                        activeTab === tab.key
                          ? "border-amber text-amber"
                          : "border-transparent text-muted-gray hover:text-near-black hover:border-border-light"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}

                  {/* Share button pushed to the right */}
                  <button
                    onClick={handleShare}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 font-body text-xs text-muted-gray hover:text-amber transition-colors rounded-lg hover:bg-amber/5"
                  >
                    {copied ? <Check size={13} className="text-sage" /> : <Share2 size={13} />}
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>

                {/* Tab content */}
                {activeTab === "about" && (
                  <div className="space-y-6">
                    {event.description && (
                      <div className="bg-white border border-border-light rounded-xl p-6">
                        <p className="font-body text-dark-gray leading-relaxed whitespace-pre-line">
                          {event.description}
                        </p>
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {event.maxCapacity && (
                        <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                          <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
                            <Users size={16} className="text-amber" />
                          </div>
                          <div>
                            <p className="font-body text-xs text-muted-gray">Total Capacity</p>
                            <p className="font-body text-sm font-semibold text-near-black">{event.maxCapacity} attendees</p>
                          </div>
                        </div>
                      )}
                      {event.startDate && (
                        <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                          <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
                            <Clock size={16} className="text-amber" />
                          </div>
                          <div>
                            <p className="font-body text-xs text-muted-gray">Date & Time</p>
                            <p className="font-body text-sm font-semibold text-near-black">{formatDate(event.startDate)}</p>
                          </div>
                        </div>
                      )}
                      {event.city && (
                        <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                          <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
                            <MapPin size={16} className="text-amber" />
                          </div>
                          <div>
                            <p className="font-body text-xs text-muted-gray">Venue</p>
                            <p className="font-body text-sm font-semibold text-near-black">{event.city}</p>
                            {event.address && <p className="font-body text-xs text-muted-gray mt-0.5">{event.address}</p>}
                          </div>
                        </div>
                      )}
                      {tickets.length > 0 && (
                        <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                          <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0">
                            <Tag size={16} className="text-amber" />
                          </div>
                          <div>
                            <p className="font-body text-xs text-muted-gray">Ticket Tiers</p>
                            <p className="font-body text-sm font-semibold text-near-black">
                              {tickets.length} tier{tickets.length !== 1 ? "s" : ""} available
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "agenda" && <AgendaSection sessions={event.sessions || []} />}

                {activeTab === "speakers" && <SpeakersSection sessions={event.sessions || []} />}

                {activeTab === "sponsors" && (
                  <div>
                    {(sponsorships || []).length === 0 ? (
                      <div className="py-10 text-center bg-cream/50 rounded-xl border border-border-light">
                        <Handshake size={32} className="mx-auto text-muted-gray mb-2 opacity-30" />
                        <p className="font-body text-sm text-muted-gray">No sponsors for this event yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="font-body text-sm text-muted-gray">
                            Proudly supported by{" "}
                            <span className="font-semibold text-near-black">
                              {(sponsorships || []).length} sponsor{(sponsorships || []).length !== 1 ? "s" : ""}
                            </span>
                          </p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(sponsorships || []).map((sp: any) => (
                            <div
                              key={sp.sponsorshipId}
                              className="flex flex-col items-center gap-3 p-5 bg-white border border-border-light rounded-xl hover:border-amber/40 hover:shadow-warm-sm transition-all text-center group"
                            >
                              {sp.logoUrl ? (
                                <img
                                  src={sp.logoUrl}
                                  alt={sp.companyName}
                                  className="h-16 max-w-[130px] object-contain group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-amber/10 flex items-center justify-center border border-amber/20 group-hover:bg-amber/15 transition-colors">
                                  <Building2 size={24} className="text-amber" />
                                </div>
                              )}
                              <div className="space-y-1">
                                <p className="font-heading text-sm font-semibold text-near-black">{sp.companyName}</p>
                                {sp.message && (
                                  <p className="font-body text-xs text-muted-gray leading-relaxed">{sp.message}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-5">
                    {/* Rating summary */}
                    {reviewSummary && (reviewSummary.totalFeedback ?? reviewSummary.totalReviews ?? 0) > 0 && (() => {
                      const total = reviewSummary.totalFeedback ?? reviewSummary.totalReviews ?? 0;
                      const avg = reviewSummary.avgEventRating ?? reviewSummary.averageRating ?? 0;
                      return (
                        <div className="bg-white border border-border-light rounded-xl p-5">
                          <div className="flex items-center gap-6">
                            <div className="text-center flex-shrink-0">
                              <p className="font-heading text-4xl font-bold text-near-black leading-none">{Number(avg).toFixed(1)}</p>
                              <div className="flex justify-center gap-0.5 mt-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} size={14} className={s <= Math.round(avg) ? "fill-amber text-amber" : "text-border-light fill-border-light"} />
                                ))}
                              </div>
                              <p className="font-body text-[11px] text-muted-gray mt-1">{total} review{total !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              {[5, 4, 3, 2, 1].map((star) => {
                                const count = reviewSummary[`rating${star}Count`] ?? 0;
                                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                return (
                                  <div key={star} className="flex items-center gap-2">
                                    <span className="font-body text-xs text-muted-gray w-2 text-right">{star}</span>
                                    <Star size={10} className="text-amber fill-amber flex-shrink-0" />
                                    <div className="flex-1 h-1.5 bg-cream rounded-full overflow-hidden">
                                      <div className="h-full bg-amber rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="font-body text-[10px] text-muted-gray w-5 text-right">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Feedback form */}
                    {isAuthenticated && event.status === "COMPLETED" && (
                      <div className="bg-white border border-border-light rounded-xl p-6">
                        <p className="font-heading text-base font-semibold text-near-black mb-4">Leave Your Feedback</p>
                        <FeedbackForm eventId={id!} />
                      </div>
                    )}

                    {/* Review list */}
                    {feedbackList.length > 0 ? (
                      <div className="space-y-3">
                        {feedbackList.map((fb: any, i: number) => {
                          const rating = fb.eventRating ?? fb.rating ?? 0;
                          const comment = fb.eventComment || fb.comment;
                          const uid = fb.userId || fb.attendeeId || "";
                          const initials = uid ? uid.slice(0, 2).toUpperCase() : "A";
                          return (
                            <div key={fb.feedbackId || fb.id || i} className="bg-white border border-border-light rounded-xl p-5">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0">
                                  <span className="font-heading text-xs font-bold text-amber">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} size={13} className={s <= rating ? "fill-amber text-amber" : "text-border-light fill-border-light"} />
                                      ))}
                                      <span className="font-body text-xs font-semibold text-near-black ml-1">{rating}/5</span>
                                    </div>
                                    {fb.createdAt && (
                                      <span className="font-body text-[11px] text-muted-gray">
                                        {new Date(fb.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                      </span>
                                    )}
                                  </div>
                                  {comment && <p className="font-body text-sm text-dark-gray mt-2 leading-relaxed">{comment}</p>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center bg-cream/50 rounded-xl border border-border-light">
                        <Star size={28} className="mx-auto text-muted-gray mb-2 opacity-30" />
                        <p className="font-body text-sm text-muted-gray">No reviews yet.</p>
                        {event.status === "COMPLETED" && isAuthenticated && (
                          <p className="font-body text-xs text-muted-gray mt-1">Be the first to share your experience!</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right sticky sidebar ── */}
            <div className="lg:sticky lg:top-6 space-y-4">
              <TicketSidebar tickets={tickets} eventId={id!} event={event} />
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
