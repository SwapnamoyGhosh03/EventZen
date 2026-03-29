import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useListEventsQuery } from "@/store/api/eventApi";
import { formatCurrency } from "@/utils/formatters";

/* ─── status badge ─── */
const STATUS_CFG: Record<string, { label: string; bg: string }> = {
  ONGOING:           { label: "Ongoing",           bg: "bg-teal-500 text-white" },
  REGISTRATION_OPEN: { label: "Open",               bg: "bg-sage text-white" },
  COMPLETED:         { label: "Completed",          bg: "bg-dusty-blue text-white" },
  PUBLISHED:         { label: "Published",          bg: "bg-amber text-near-black" },
  DRAFT:             { label: "Draft",              bg: "bg-muted-gray/60 text-near-black" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status.replace(/_/g, " "), bg: "bg-amber text-near-black" };
  return (
    <span className={`${cfg.bg} font-accent text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full`}>
      {cfg.label}
    </span>
  );
}

/* ─── 3-D position config ─── */
interface PosCfg {
  x: number; scale: number; rotateY: number; opacity: number; zIndex: number;
}

function getPos(offset: number): PosCfg {
  if (offset === 0)  return { x: 0,          scale: 1.00, rotateY:   0, opacity: 1.00, zIndex: 10 };
  if (offset === -1) return { x: -300,        scale: 0.78, rotateY:  18, opacity: 0.80, zIndex: 5  };
  if (offset ===  1) return { x:  300,        scale: 0.78, rotateY: -18, opacity: 0.80, zIndex: 5  };
  if (offset === -2) return { x: -520,        scale: 0.60, rotateY:  30, opacity: 0.45, zIndex: 2  };
  if (offset ===  2) return { x:  520,        scale: 0.60, rotateY: -30, opacity: 0.45, zIndex: 2  };
  return { x: offset < 0 ? -700 : 700,       scale: 0.45, rotateY: offset < 0 ? 38 : -38, opacity: 0, zIndex: 1 };
}

/* ─── single event card ─── */
function EventCard({ event, isCenter, onClick }: { event: any; isCenter: boolean; onClick: () => void }) {
  const formattedDate = new Date(event.startDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div
      className={`w-full bg-white rounded-2xl overflow-hidden shadow-warm-md border border-border-light
        transition-shadow duration-300 ${isCenter ? "shadow-warm-lg" : ""} ${!isCenter ? "cursor-pointer" : ""}`}
      onClick={!isCenter ? onClick : undefined}
    >
      {/* Banner */}
      <div className="relative h-48 bg-cream overflow-hidden">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-amber/10 flex items-center justify-center">
            <Calendar size={40} className="text-amber/30" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-heading text-lg font-bold text-near-black mb-3 line-clamp-1">
          {event.title}
        </h3>
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-muted-gray">
            <Calendar size={13} className="shrink-0" />
            <span className="font-body text-sm">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-gray">
            <MapPin size={13} className="shrink-0" />
            <span className="font-body text-sm">{event.city || "TBA"}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-heading text-lg font-bold text-amber">
            {event.isFree || !event.basePrice || event.basePrice === 0
              ? "Free"
              : formatCurrency(event.basePrice)}
          </span>
          {isCenter && (
            <Link
              to={`/events/${event.eventId || event.id}`}
              className="flex items-center gap-1 font-body text-sm font-medium text-amber hover:text-amber-dark transition-colors"
            >
              View Details <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── main component ─── */
export default function FeaturedEvents() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const [active, setActive] = useState(0);

  const { data } = useListEventsQuery({ size: 8 });
  const events: any[] = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : [];

  const count = events.length;
  const prev = () => setActive((a) => (a - 1 + count) % count);
  const next = () => setActive((a) => (a + 1) % count);

  if (count === 0) {
    return (
      <section className="section-white section-padding" ref={ref}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-3">
            Upcoming Events
          </h2>
          <p className="font-body text-dark-gray">No events published yet. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-white section-padding overflow-hidden" ref={ref}>
      <div className="max-w-6xl mx-auto">

        {/* Header row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-1">
              Upcoming Events
            </h2>
            <p className="font-body text-dark-gray">
              Discover experiences that inspire and connect
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center
                hover:bg-cream transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center
                hover:bg-cream transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* ── 3-D carousel ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Perspective wrapper */}
          <div
            className="relative h-[420px] select-none"
            style={{ perspective: "1400px", perspectiveOrigin: "50% 40%" }}
          >
            {events.map((event: any, idx: number) => {
              let offset = idx - active;
              // Wrap for circular loop
              if (offset > count / 2)  offset -= count;
              if (offset < -count / 2) offset += count;
              if (Math.abs(offset) > 2) return null;
              const pos = getPos(offset);
              const isCenter = offset === 0;

              return (
                <motion.div
                  key={event.eventId || event.id}
                  animate={{
                    x: pos.x,
                    scale: pos.scale,
                    rotateY: pos.rotateY,
                    opacity: pos.opacity,
                  }}
                  transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "calc(50% - 160px)",  /* half of 320px card */
                    width: "320px",
                    zIndex: pos.zIndex,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <EventCard
                    event={event}
                    isCenter={isCenter}
                    onClick={() => setActive(idx)}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Dot + mobile nav row */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="md:hidden w-9 h-9 rounded-full border border-border-light flex items-center justify-center
                hover:bg-cream transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex gap-2">
              {events.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? "w-6 bg-amber" : "w-2 bg-border-light hover:bg-muted-gray"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="md:hidden w-9 h-9 rounded-full border border-border-light flex items-center justify-center
                hover:bg-cream transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
