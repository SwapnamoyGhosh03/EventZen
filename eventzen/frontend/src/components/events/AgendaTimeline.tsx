import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import { formatTime } from "@/utils/formatters";

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  location?: string;
}

interface AgendaTimelineProps {
  sessions: Session[];
}

export default function AgendaTimeline({ sessions }: AgendaTimelineProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <p className="font-body text-muted-gray text-center py-8">
        No sessions scheduled yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-light" />

      <div className="space-y-6">
        {sessions.map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.25, 1, 0.5, 1] as const }}
            className="relative pl-12"
          >
            {/* Dot */}
            <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-amber border-2 border-white" />

            <div className="bg-white border border-border-light rounded-lg p-4 hover:shadow-warm-sm transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h4 className="font-heading text-base font-semibold text-near-black">
                  {session.title}
                </h4>
                <div className="flex items-center gap-1.5 text-muted-gray flex-shrink-0">
                  <Clock size={14} />
                  <span className="font-body text-xs">
                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                  </span>
                </div>
              </div>
              {session.description && (
                <p className="font-body text-sm text-dark-gray mb-2">
                  {session.description}
                </p>
              )}
              {session.speaker && (
                <div className="flex items-center gap-1.5 text-muted-gray">
                  <User size={14} />
                  <span className="font-body text-xs">{session.speaker}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
