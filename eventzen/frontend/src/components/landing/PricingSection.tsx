import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Clock,
  HeadphonesIcon,
  CalendarCheck,
  Ticket,
  Star,
  Gift,
  ArrowUpRight,
  Phone,
} from "lucide-react";
import Button from "@/components/ui/Button";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: [0.25, 1, 0.5, 1] as const },
});

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  icon: React.ElementType;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  badgeText?: string;
  cta: string;
  features: { icon: React.ElementType; text: string; highlight?: boolean }[];
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "ZenStarter",
    tagline: "Perfect for casual event-goers",
    price: 499,
    icon: Sparkles,
    accentBg: "bg-sage/10",
    accentText: "text-sage",
    accentBorder: "border-sage/30",
    cta: "Get Started",
    features: [
      { icon: Ticket, text: "5% discount on every ticket booking", highlight: true },
      { icon: Clock, text: "12-hour early access before public sale" },
      { icon: CalendarCheck, text: "Event reminders & calendar sync" },
      { icon: Star, text: "Personalised event recommendations" },
      { icon: HeadphonesIcon, text: "Email support" },
    ],
  },
  {
    id: "pro",
    name: "ZenPro",
    tagline: "For the regular event enthusiast",
    price: 1499,
    icon: Zap,
    accentBg: "bg-amber/10",
    accentText: "text-amber",
    accentBorder: "border-amber/40",
    badgeText: "Most Popular",
    cta: "Go Pro",
    features: [
      { icon: Ticket, text: "15% discount on every ticket booking", highlight: true },
      { icon: Clock, text: "48-hour early access before public sale" },
      { icon: CalendarCheck, text: "Waitlist priority on sold-out events" },
      { icon: Star, text: "Access to exclusive member-only events" },
      { icon: CalendarCheck, text: "Event reminders & calendar sync" },
      { icon: HeadphonesIcon, text: "Priority chat + email support" },
    ],
  },
  {
    id: "max",
    name: "ZenMax",
    tagline: "The ultimate VIP experience",
    price: 2999,
    icon: Crown,
    accentBg: "bg-burgundy/10",
    accentText: "text-burgundy",
    accentBorder: "border-burgundy/30",
    cta: "Go Max",
    features: [
      { icon: Ticket, text: "25% discount on every ticket booking", highlight: true },
      { icon: Gift, text: "1 free ticket on every 3rd event booked", highlight: true },
      { icon: Clock, text: "72-hour first-mover access before public sale" },
      { icon: ArrowUpRight, text: "Top of every waitlist — guaranteed" },
      { icon: Star, text: "Complimentary seat upgrade requests" },
      { icon: Gift, text: "Guest pass — share or transfer tickets" },
      { icon: CalendarCheck, text: "Personalised event concierge curation" },
      { icon: Phone, text: "Dedicated VIP phone + chat + email support" },
    ],
  },
];

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const isPro = plan.id === "pro";
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.12, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      className={`relative flex flex-col rounded-2xl border ${
        isPro
          ? "border-amber/50 bg-near-black shadow-[0_0_40px_rgba(212,168,67,0.15)]"
          : "border-white/10 bg-white/5"
      } overflow-hidden`}
    >
      {/* Popular badge */}
      {plan.badgeText && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px">
          <span className="inline-block bg-amber text-near-black text-xs font-accent font-bold uppercase tracking-widest px-4 py-1 rounded-b-lg">
            {plan.badgeText}
          </span>
        </div>
      )}

      <div className={`p-8 ${isPro ? "pt-12" : ""}`}>
        {/* Icon + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl ${plan.accentBg} flex items-center justify-center`}>
            <Icon size={20} className={plan.accentText} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-lg leading-none">
              {plan.name}
            </h3>
            <p className="font-body text-white/45 text-xs mt-0.5">{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-body text-white/50 text-base">₹</span>
          <span className="font-heading font-bold text-white text-5xl leading-none">
            {plan.price.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="font-body text-white/35 text-sm mb-7">per month · billed monthly</p>

        {/* CTA */}
        <Link to="/auth" className="block">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 rounded-xl font-accent font-semibold text-sm tracking-wide transition-colors duration-200 ${
              isPro
                ? "bg-amber text-near-black hover:bg-amber-dark"
                : "bg-white/10 text-white border border-white/15 hover:bg-white/15"
            }`}
          >
            {plan.cta}
          </motion.button>
        </Link>
      </div>

      {/* Divider */}
      <div className={`mx-8 h-px ${isPro ? "bg-amber/20" : "bg-white/8"}`} />

      {/* Features */}
      <div className="p-8 flex-1 flex flex-col gap-3.5">
        {plan.features.map((feat, i) => {
          const FIcon = feat.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center ${
                  feat.highlight ? plan.accentBg : "bg-white/8"
                }`}
              >
                <Check
                  size={10}
                  className={feat.highlight ? plan.accentText : "text-white/50"}
                  strokeWidth={2.5}
                />
              </div>
              <span
                className={`font-body text-sm leading-relaxed ${
                  feat.highlight ? "text-white font-medium" : "text-white/55"
                }`}
              >
                {feat.text}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-near-black section-padding"
    >
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] rounded-full bg-amber/8 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] rounded-full bg-burgundy/10 blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          {inView && (
            <>
              <motion.p
                {...fadeUp(0)}
                className="font-accent text-amber text-sm uppercase tracking-[0.2em] mb-3"
              >
                Membership Plans
              </motion.p>
              <motion.h2
                {...fadeUp(0.08)}
                className="font-heading text-4xl md:text-5xl font-bold text-white mb-4"
              >
                One subscription,{" "}
                <span className="text-amber">endless events</span>
              </motion.h2>
              <motion.p
                {...fadeUp(0.16)}
                className="font-body text-white/50 text-lg max-w-xl mx-auto"
              >
                Choose the plan that fits your lifestyle. Save more, attend more
                — every month.
              </motion.p>
            </>
          )}
        </div>

        {/* Cards */}
        {inView && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {plans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} index={i} />
            ))}
          </div>
        )}

        {/* Footer note */}
        {inView && (
          <motion.p
            {...fadeUp(0.6)}
            className="text-center font-body text-white/30 text-sm mt-10"
          >
            All plans are billed monthly. Cancel anytime. Discounts apply at
            checkout automatically.
          </motion.p>
        )}
      </div>
    </section>
  );
}
