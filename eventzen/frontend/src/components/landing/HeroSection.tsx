import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarPlus,
  Ticket,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";

/* ─── animation variants ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.65, ease: [0.25, 1, 0.5, 1] as const },
});

const featureCards = [
  {
    icon: CalendarPlus,
    title: "Build Events",
    desc: "Draft, publish, and manage events of any scale — all from one dashboard.",
    accent: "bg-amber/20",
    iconColor: "text-amber",
    delay: 0.6,
    float: { y: [0, -10, 0], duration: 5 },
  },
  {
    icon: Ticket,
    title: "Sell Tickets",
    desc: "Multiple ticket tiers, real-time capacity tracking, and instant confirmations.",
    accent: "bg-rose/20",
    iconColor: "text-rose",
    delay: 0.75,
    float: { y: [0, 8, 0], duration: 6 },
  },
  {
    icon: Users,
    title: "Manage Guests",
    desc: "Attendee lists, registrations, and check-in flows — all synced live.",
    accent: "bg-sage/20",
    iconColor: "text-sage",
    delay: 0.9,
    float: { y: [0, -6, 0], duration: 4.5 },
  },
  {
    icon: BarChart3,
    title: "Track Analytics",
    desc: "Revenue, occupancy, and engagement metrics updated in real time.",
    accent: "bg-dusty-blue/20",
    iconColor: "text-dusty-blue",
    delay: 1.05,
    float: { y: [0, 9, 0], duration: 5.5 },
  },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-near-black">
      {/* ── ambient glow blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-amber/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-burgundy/15 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-sage/10 blur-[100px]" />
        {/* faint grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── giant watermark logo ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
        <LogoMark size={520} />
      </div>

      {/* ── main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-8 pt-28 pb-20">
        {/* pill badge */}
        <motion.div {...fadeUp(0.1)} className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-amber px-4 py-1.5 rounded-full font-accent text-sm tracking-wide">
            <Sparkles size={14} />
            Event Management, Reimagined
          </span>
        </motion.div>

        {/* headline */}
        <motion.h1
          {...fadeUp(0.2)}
          className="font-heading text-center text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] mb-6"
        >
          Create.&nbsp;
          <span className="text-amber">Sell.</span>
          <br />
          Celebrate.
        </motion.h1>

        {/* subheading */}
        <motion.p
          {...fadeUp(0.35)}
          className="font-body text-center text-lg md:text-xl text-white/60 leading-relaxed max-w-xl mx-auto mb-10"
        >
          Plan any event, sell tickets with zero friction, and give every
          attendee an experience worth remembering.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.45)}
          className="flex flex-wrap justify-center gap-4 mb-20"
        >
          <Link to="/events">
            <Button variant="primary" size="lg">
              Explore Events
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              variant="secondary"
              size="lg"
              className="border-white/40 text-white/80 hover:border-white hover:text-white hover:bg-white/10"
            >
              Sign Up
            </Button>
          </Link>
        </motion.div>

        {/* ── feature cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: card.delay,
                  duration: 0.6,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <motion.div
                  animate={{ y: card.float.y }}
                  transition={{
                    duration: card.float.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-full bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/8 hover:border-white/20 transition-colors duration-300 group"
                >
                  <div
                    className={`w-11 h-11 ${card.accent} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon size={20} className={card.iconColor} />
                  </div>
                  <h3 className="font-heading text-white font-semibold text-base mb-1.5">
                    {card.title}
                  </h3>
                  <p className="font-body text-white/50 text-sm leading-relaxed">
                    {card.desc}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* ── bottom stat strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mt-14 flex flex-wrap justify-center gap-x-10 gap-y-3"
        >
          {[
            { value: "10,000+", label: "Events Hosted" },
            { value: "500K+", label: "Tickets Sold" },
            { value: "99.9%", label: "Platform Uptime" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-2xl font-bold text-amber">
                {s.value}
              </p>
              <p className="font-body text-xs text-white/40 uppercase tracking-widest mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
