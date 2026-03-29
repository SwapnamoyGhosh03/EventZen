import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import RatingDisplay from "@/components/reviews/RatingDisplay";
import { formatShortDate, formatCurrency } from "@/utils/formatters";
import { EVENT_STATUS_COLORS } from "@/config/constants";

interface EventCardProps {
  event: any;
  index?: number;
}

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.25, 1, 0.5, 1] as const,
    },
  }),
};

export default function EventCard({ event, index = 0 }: EventCardProps) {
  // Internal → public-facing label mapping
  const publicStatusLabel: Record<string, string> = {
    PUBLISHED: "Upcoming",
    REGISTRATION_OPEN: "Ongoing",
    ONGOING: "Ongoing",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
    DRAFT: "Draft",
  };

  const statusVariant =
    event.status === "REGISTRATION_OPEN" || event.status === "ONGOING"
      ? "warning"
      : event.status === "COMPLETED"
        ? "danger"
        : "info";

  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link to={`/events/${event.eventId || event.id}`} className="block h-full">
        <div className="bg-white border border-border-light rounded-lg overflow-hidden h-full transition-shadow duration-300 hover:shadow-card-hover">
          {/* Banner */}
          <div className="h-48 bg-gradient-to-br from-amber/20 to-blush/30 flex items-center justify-center relative">
            {event.bannerUrl ? (
              <img
                src={event.bannerUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl opacity-40">&#127879;</span>
            )}
            <div className="absolute top-3 left-3">
              <Badge variant={statusVariant}>
                {publicStatusLabel[event.status] ?? event.status?.replace(/_/g, " ")}
              </Badge>
            </div>
            {event.category && (
              <div className="absolute top-3 right-3">
                <span className="bg-white/90 text-near-black px-2.5 py-1 rounded-md font-body text-xs font-medium">
                  {event.categoryName || event.category}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-heading text-lg font-semibold text-near-black mb-2 line-clamp-2">
              {event.title}
            </h3>
            {event.description && (
              <p className="font-body text-sm text-muted-gray mb-3 line-clamp-2">
                {event.description}
              </p>
            )}
            <div className="space-y-1.5 mb-4">
              {event.startDate && (
                <div className="flex items-center gap-2 text-dark-gray">
                  <Calendar size={14} className="text-muted-gray" />
                  <span className="font-body text-sm">
                    {formatShortDate(event.startDate)}
                  </span>
                </div>
              )}
              {event.city && (
                <div className="flex items-center gap-2 text-dark-gray">
                  <MapPin size={14} className="text-muted-gray" />
                  <span className="font-body text-sm">{event.city}</span>
                </div>
              )}
              {event.status === "COMPLETED" && (
                <RatingDisplay eventId={event.eventId || event.id} compact />
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border-light">
              <span className="font-heading text-lg font-bold text-amber">
                {event.isFree === true
                  ? "Free"
                  : event.basePrice > 0
                    ? `From ${formatCurrency(event.basePrice)}`
                    : "See Tickets"}
              </span>
              <span className="flex items-center gap-1 font-body text-sm text-amber font-medium group-hover:gap-2 transition-all">
                Details <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
