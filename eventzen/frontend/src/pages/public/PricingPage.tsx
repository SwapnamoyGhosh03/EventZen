import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  Zap,
  Crown,
  Check,
  Clock,
  HeadphonesIcon,
  CalendarCheck,
  Ticket,
  Star,
  Gift,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";

/* ─── plan data ─── */
interface Feature {
  icon: React.ElementType;
  text: string;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  Icon: React.ElementType;
  popular?: boolean;
  features: Feature[];
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "ZenStarter",
    tagline: "Perfect for casual event-goers",
    price: 499,
    Icon: Sparkles,
    features: [
      { icon: Ticket, text: "5% discount on every ticket booking", highlight: true },
      { icon: Clock, text: "12-hr early access before public sale" },
      { icon: CalendarCheck, text: "Event reminders & calendar sync" },
      { icon: HeadphonesIcon, text: "Email support" },
    ],
  },
  {
    id: "pro",
    name: "ZenPro",
    tagline: "For the regular event enthusiast",
    price: 1499,
    Icon: Zap,
    popular: true,
    features: [
      { icon: Ticket, text: "15% discount on every ticket booking", highlight: true },
      { icon: Clock, text: "48-hr early access before public sale" },
      { icon: Star, text: "Access to exclusive member-only events" },
      { icon: HeadphonesIcon, text: "Priority chat + email support" },
    ],
  },
  {
    id: "max",
    name: "ZenMax",
    tagline: "The ultimate VIP experience",
    price: 2999,
    Icon: Crown,
    features: [
      { icon: Ticket, text: "25% discount on every ticket booking", highlight: true },
      { icon: Gift, text: "1 free ticket every 3rd event booked", highlight: true },
      { icon: Clock, text: "72-hr first-mover access before sale" },
      { icon: Gift, text: "Guest pass — share or transfer tickets" },
    ],
  },
];

/* ─── single card ─── */
function PlanCard({ plan, delay }: { plan: Plan; delay: number }) {
  const { Icon } = plan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
      className={`relative flex flex-col bg-white rounded-2xl border-2 border-near-black shadow-[4px_4px_0px_#1E1E1E] ${
        plan.popular ? "md:-mt-4 md:mb-4" : ""
      }`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3.5 right-6 z-10">
          <span className="inline-block bg-amber text-near-black font-accent font-bold text-xs px-4 py-1.5 rounded-full rotate-2 shadow-sm">
            Popular!
          </span>
        </div>
      )}

      <div className="p-7 pb-5">
        {/* Circle icon */}
        <div
          className={`w-14 h-14 rounded-full border-2 border-near-black flex items-center justify-center mb-5 ${
            plan.popular ? "bg-amber/10" : "bg-cream"
          }`}
        >
          <Icon size={22} className={plan.popular ? "text-amber" : "text-near-black"} strokeWidth={1.8} />
        </div>

        {/* Name + tagline */}
        <h3 className="font-heading text-2xl font-bold text-near-black leading-tight mb-0.5">
          {plan.name}
        </h3>
        <p className="font-body text-sm text-muted-gray mb-6">{plan.tagline}</p>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-6">
          <span className="font-body text-near-black text-lg font-medium">₹</span>
          <span className="font-heading text-5xl font-bold text-near-black leading-none">
            {plan.price.toLocaleString("en-IN")}
          </span>
          <span className="font-body text-muted-gray text-sm ml-1">/month</span>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-7">
          {plan.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  feat.highlight
                    ? plan.popular
                      ? "border-amber bg-amber/10"
                      : "border-near-black bg-near-black/5"
                    : "border-muted-gray/40"
                }`}
              >
                <Check
                  size={10}
                  strokeWidth={3}
                  className={
                    feat.highlight
                      ? plan.popular
                        ? "text-amber"
                        : "text-near-black"
                      : "text-muted-gray"
                  }
                />
              </div>
              <span
                className={`font-body text-sm leading-relaxed ${
                  feat.highlight ? "text-near-black font-medium" : "text-dark-gray"
                }`}
              >
                {feat.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-7 pb-7 mt-auto">
        <Link to={`/subscription/checkout/${plan.id}`} className="block">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3.5 rounded-xl border-2 font-accent font-bold text-sm tracking-wide transition-colors duration-200 ${
              plan.popular
                ? "bg-amber border-amber text-near-black hover:bg-amber-dark hover:border-amber-dark"
                : "bg-white border-near-black text-near-black hover:bg-near-black hover:text-white"
            }`}
          >
            Get Started
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── page ─── */
export default function PricingPage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8" ref={ref}>
          {/* Header */}
          {inView && (
            <div className="text-center mb-14">
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="font-accent text-amber text-sm uppercase tracking-[0.2em] mb-3"
              >
                Membership Plans
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="font-heading text-4xl md:text-5xl font-bold text-near-black mb-4"
              >
                One subscription,{" "}
                <span className="relative inline-block">
                  endless events
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber rounded-full" />
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                className="font-body text-dark-gray text-lg max-w-xl mx-auto"
              >
                Choose your plan. Save on every booking. Cancel anytime.
              </motion.p>
            </div>
          )}

          {/* Cards */}
          {inView && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {plans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} delay={0.1 + i * 0.1} />
              ))}
            </div>
          )}

          {/* Footer note */}
          {inView && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="text-center font-body text-muted-gray text-sm mt-10"
            >
              All plans are billed monthly · Discounts applied automatically at
              checkout · Cancel anytime
            </motion.p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
