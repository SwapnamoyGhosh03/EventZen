import { motion } from "framer-motion";
import EventCard from "./EventCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Calendar } from "lucide-react";

interface EventGridProps {
  events: any[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function EventGrid({
  events,
  isLoading,
  emptyMessage = "No events found",
}: EventGridProps) {
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={28} />}
        title="No Events Found"
        description={emptyMessage}
      />
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {events.map((event, i) => (
        <EventCard key={event.eventId || event.id} event={event} index={i} />
      ))}
    </motion.div>
  );
}
