import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

/* ─── testimonials ─── */
const TESTIMONIALS = [
  {
    quote:
      "EventZen transformed how we attend events. The digital QR pass and instant check-in made everything seamless — no queues, no hassle.",
    name: "Priya Sharma",
    role: "Regular Attendee",
    initials: "PS",
    color: "bg-sage",
  },
  {
    quote:
      "Booked tickets for three events in one go. My ZenPro subscription paid for itself on the very first booking — the 15% off is real.",
    name: "Arjun Mehta",
    role: "ZenPro Member",
    initials: "AM",
    color: "bg-amber",
  },
  {
    quote:
      "The recommendations led me to a cooking workshop I never would have found otherwise. EventZen just gets what I like.",
    name: "Ritika Nair",
    role: "Food & Art Enthusiast",
    initials: "RN",
    color: "bg-terracotta",
  },
  {
    quote:
      "Checked in 500 attendees at our tech fest without a single hiccup. The organizer dashboard and finance reports are exceptional.",
    name: "Dev Kapoor",
    role: "Event Organizer",
    initials: "DK",
    color: "bg-dusty-blue",
  },
];

const STATS = [
  { value: "10K+",  label: "Events Hosted",    bg: "bg-amber/10" },
  { value: "500K+", label: "Happy Attendees",   bg: "bg-sage/10" },
  { value: "4.9★",  label: "Avg. Rating",       bg: "bg-burgundy/10" },
  { value: "99.9%", label: "Platform Uptime",   bg: "bg-dusty-blue/10" },
];

/* ─── static event gallery images ─── */
const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop",
    label: "Global Tech Summit 2024",
    city: "San Francisco, USA",
  },
  {
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&auto=format&fit=crop",
    label: "Neon Nights Music Festival",
    city: "Barcelona, Spain",
  },
  {
    src: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&auto=format&fit=crop",
    label: "Indie Arts & Culture Fair",
    city: "Berlin, Germany",
  },
  {
    src: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&auto=format&fit=crop",
    label: "Sunburn Electronic Festival",
    city: "Goa, India",
  },
  {
    src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop",
    label: "Coachella Valley Music & Arts",
    city: "California, USA",
  },
  {
    src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&auto=format&fit=crop",
    label: "Arena Rock World Tour",
    city: "London, UK",
  },
];

/* ─── component ─── */
export default function GallerySection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  const [activePic, setActivePic] = useState(0);
  const [activeTest, setActiveTest] = useState(0);

  /* auto-advance gallery */
  useEffect(() => {
    if (!isInView) return;
    const t = setInterval(
      () => setActivePic((c) => (c + 1) % GALLERY.length),
      3600
    );
    return () => clearInterval(t);
  }, [isInView]);

  /* auto-advance testimonials */
  useEffect(() => {
    if (!isInView) return;
    const t = setInterval(
      () => setActiveTest((c) => (c + 1) % TESTIMONIALS.length),
      4800
    );
    return () => clearInterval(t);
  }, [isInView]);

  const prevTest = () =>
    setActiveTest((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const nextTest = () =>
    setActiveTest((c) => (c + 1) % TESTIMONIALS.length);

  return (
    <section className="section-cream section-padding overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-start">

          {/* ── LEFT — Gallery ── */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
          >
            <p className="font-accent text-amber text-sm uppercase tracking-[0.2em] mb-2">
              Event Gallery
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-3 leading-tight">
              Moments From<br className="hidden sm:block" /> Our Events
            </h2>
            <p className="font-body text-dark-gray mb-6 max-w-sm">
              Real events, real memories — all powered by EventZen.
            </p>

            {/* Featured image */}
            <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 md:h-96 shadow-warm-md border border-border-light mb-3">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activePic}
                  src={GALLERY[activePic].src}
                  alt={GALLERY[activePic].label}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
                  draggable={false}
                />
              </AnimatePresence>

              {/* Caption overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-near-black/65 to-transparent px-5 py-4 pointer-events-none">
                <p className="font-heading text-white font-semibold text-sm leading-snug line-clamp-1">
                  {GALLERY[activePic].label}
                </p>
                <p className="font-body text-white/65 text-xs mt-0.5">
                  {GALLERY[activePic].city}
                </p>
              </div>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {GALLERY.map((item, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActivePic(i)}
                  className={`flex-shrink-0 w-[72px] h-[56px] rounded-xl overflow-hidden transition-all duration-200 ${
                    i === activePic
                      ? "ring-2 ring-amber ring-offset-2 opacity-100"
                      : "opacity-55 hover:opacity-85"
                  }`}
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </motion.button>
              ))}
            </div>

            <div className="mt-7">
              <Link to="/events">
                <Button variant="primary">Explore All Events</Button>
              </Link>
            </div>
          </motion.div>

          {/* ── RIGHT — Testimonials + Stats ── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.18, duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
            className="lg:pt-14"
          >
            <p className="font-accent text-amber text-sm uppercase tracking-[0.2em] mb-2">
              Testimonials
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-near-black mb-8 leading-tight">
              What Attendees Say
            </h2>

            {/* Testimonial card */}
            <div className="relative min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTest}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  className="bg-white rounded-2xl border border-border-light shadow-warm-md p-7"
                >
                  <Quote size={30} className="text-amber mb-4 opacity-65" />
                  <blockquote className="font-body text-dark-gray text-base leading-relaxed mb-6 italic">
                    &ldquo;{TESTIMONIALS[activeTest].quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full ${TESTIMONIALS[activeTest].color}
                        flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="font-accent font-semibold text-white text-sm">
                        {TESTIMONIALS[activeTest].initials}
                      </span>
                    </div>
                    <div>
                      <p className="font-body font-semibold text-near-black text-sm">
                        {TESTIMONIALS[activeTest].name}
                      </p>
                      <p className="font-body text-xs text-muted-gray">
                        {TESTIMONIALS[activeTest].role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-5 mb-8">
              <button
                onClick={prevTest}
                className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center
                  hover:bg-white transition-colors"
              >
                <ChevronLeft size={17} />
              </button>
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTest(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeTest
                        ? "w-6 bg-amber"
                        : "w-2 bg-border-light hover:bg-muted-gray"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTest}
                className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center
                  hover:bg-white transition-colors"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className={`${s.bg} rounded-xl p-4 text-center`}
                >
                  <p className="font-heading text-2xl font-bold text-near-black">
                    {s.value}
                  </p>
                  <p className="font-body text-xs text-muted-gray mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
