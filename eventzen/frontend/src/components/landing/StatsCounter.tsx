import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar, Users, MapPin, Star } from "lucide-react";
import { useListEventsQuery } from "@/store/api/eventApi";

export default function StatsCounter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  const { data: eventsData } = useListEventsQuery({ size: 1 });
  const totalEvents = eventsData?.meta?.total || 0;

  const stats = [
    { icon: Calendar, label: "Events Hosted", value: totalEvents },
    { icon: Users, label: "Attendees Served", value: 0 },
    { icon: MapPin, label: "Cities Covered", value: 0 },
    { icon: Star, label: "Satisfaction Rate", value: "—" },
  ];

  return (
    <section className="section-white section-padding" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 1, 0.5, 1] as const }}
              className="text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-amber/10 rounded-xl flex items-center justify-center">
                <stat.icon size={24} className="text-amber" />
              </div>
              <div className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-1">
                {stat.value}
              </div>
              <p className="font-body text-sm text-muted-gray">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
