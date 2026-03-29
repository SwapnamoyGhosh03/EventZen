import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote:
      "EventZen transformed how we manage our annual conference. The agenda builder and check-in system saved us hours of work.",
    name: "Sarah Chen",
    role: "Event Director, TechConf Global",
    avatar: "SC",
  },
  {
    id: 2,
    quote:
      "As a venue owner, the booking management and financial reporting features are exactly what we needed. Incredibly intuitive.",
    name: "Marcus Williams",
    role: "Operations Manager, Grand Arena",
    avatar: "MW",
  },
  {
    id: 3,
    quote:
      "The attendee experience is seamless. Digital tickets, instant check-in, and the feedback system all work beautifully together.",
    name: "Priya Sharma",
    role: "Community Lead, DevConnect",
    avatar: "PS",
  },
  {
    id: 4,
    quote:
      "We scaled from 200 to 5,000 attendees without breaking a sweat. EventZen handles the complexity so we can focus on content.",
    name: "James Rodriguez",
    role: "Founder, StartupWeek",
    avatar: "JR",
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const prev = () =>
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="section-burgundy section-padding" ref={ref}>
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-cream mb-12">
            What Our Users Say
          </h2>
        </motion.div>

        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] as const }}
          className="mb-10"
        >
          <Quote size={40} className="text-amber mx-auto mb-6 opacity-60" />
          <blockquote className="font-display text-xl md:text-2xl italic text-cream/90 leading-relaxed mb-8 max-w-2xl mx-auto">
            &ldquo;{testimonials[current].quote}&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber text-white flex items-center justify-center font-accent font-semibold">
              {testimonials[current].avatar}
            </div>
            <div className="text-left">
              <p className="font-body font-semibold text-cream">
                {testimonials[current].name}
              </p>
              <p className="font-body text-sm text-cream/60">
                {testimonials[current].role}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="p-2 rounded-full border border-cream/20 text-cream hover:bg-cream/10 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${i === current ? "bg-amber w-6" : "bg-cream/30"}
                `}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="p-2 rounded-full border border-cream/20 text-cream hover:bg-cream/10 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
