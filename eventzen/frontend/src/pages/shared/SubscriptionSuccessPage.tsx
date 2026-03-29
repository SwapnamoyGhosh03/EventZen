import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Sparkles, Zap, Crown, ArrowRight,
  Ticket, ShieldCheck, Hash, Receipt, CalendarDays,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Button from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionSuccessState {
  planId: string;
  planName: string;
  planTagline: string;
  price: number;
  taxes: number;
  total: number;
  paymentMethod: string;
  paymentRef: string;
  purchasedAt: string;
  highlights: string[];
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  starter: Sparkles,
  pro: Zap,
  max: Crown,
};

const PLAN_ACCENT: Record<string, string> = {
  starter: "text-sage",
  pro: "text-amber",
  max: "text-burgundy",
};

const PLAN_BG: Record<string, string> = {
  starter: "from-sage/20 to-sage/5",
  pro: "from-amber/20 to-amber/5",
  max: "from-burgundy/20 to-burgundy/5",
};

function methodLabel(m?: string) {
  if (!m) return "—";
  if (m === "card") return "Credit / Debit Card";
  if (m === "upi") return "UPI";
  if (m === "netbanking") return "Net Banking";
  return m;
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Confetti particle ───────────────────────────────────────────────────────

function ConfettiParticle({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      className={`absolute w-2 h-2 rounded-sm ${color}`}
      style={{ left: `${x}%`, top: -8 }}
      initial={{ y: -10, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ y: 420, opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1), scale: 0.5 }}
      transition={{ duration: 2.2 + Math.random() * 1.2, delay, ease: "easeIn" }}
    />
  );
}

const CONFETTI_COLORS = [
  "bg-amber", "bg-sage", "bg-burgundy", "bg-blush",
  "bg-dusty-blue", "bg-terracotta", "bg-amber/70", "bg-sage/70",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as SubscriptionSuccessState | null;
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3800);
    return () => clearTimeout(t);
  }, []);

  if (!state) {
    return (
      <PageTransition>
        <div className="max-w-lg mx-auto py-20 text-center">
          <p className="font-body text-muted-gray mb-6">No subscription details found.</p>
          <Button onClick={() => navigate("/pricing")}>Back to Pricing</Button>
        </div>
      </PageTransition>
    );
  }

  const {
    planId, planName, planTagline, price, taxes, total,
    paymentMethod, paymentRef, purchasedAt, highlights,
  } = state;

  const PlanIcon = PLAN_ICONS[planId] ?? Sparkles;
  const accentText = PLAN_ACCENT[planId] ?? "text-amber";
  const gradBg = PLAN_BG[planId] ?? "from-amber/20 to-amber/5";

  // Compute subscription period
  const start = new Date(purchasedAt);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const confettiParticles = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    delay: i * 0.055,
    x: Math.round((i / 36) * 100) + (Math.random() * 6 - 3),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto py-6 px-4 relative">

        {/* ── Confetti ── */}
        <AnimatePresence>
          {showConfetti && (
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-[420px] overflow-hidden z-20">
              {confettiParticles.map((p) => (
                <ConfettiParticle key={p.id} delay={p.delay} x={p.x} color={p.color} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* ── Success header ── */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="text-center mb-8"
        >
          {/* Animated ring + icon */}
          <div className="relative w-24 h-24 mx-auto mb-5">
            {/* Outer pulsing ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-sage/20"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Inner ring */}
            <motion.div
              className="absolute inset-2 rounded-full bg-sage/15"
              animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            {/* Icon circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
              className="absolute inset-0 rounded-full bg-sage/20 flex items-center justify-center"
            >
              <CheckCircle2 size={44} className="text-sage" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-heading text-3xl font-bold text-near-black mb-2"
          >
            You're subscribed!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="font-body text-dark-gray"
          >
            Welcome to <span className="font-semibold text-near-black">{planName}</span>. Your benefits activate immediately.
          </motion.p>
        </motion.div>

        {/* ── Plan activation card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55 }}
          className={`bg-gradient-to-br ${gradBg} rounded-2xl p-5 mb-4 border border-border-light`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-warm-sm">
              <PlanIcon size={20} className={accentText} />
            </div>
            <div>
              <p className="font-heading font-bold text-near-black">{planName}</p>
              <p className="font-body text-xs text-muted-gray">{planTagline}</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 bg-sage/20 text-sage text-xs font-accent font-semibold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
              Active
            </span>
          </div>

          {/* Active period */}
          <div className="flex items-center gap-2 bg-white/60 rounded-xl px-4 py-2.5 mb-4">
            <CalendarDays size={14} className="text-muted-gray shrink-0" />
            <span className="font-body text-sm text-dark-gray">
              {start.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" → "}
              {end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {/* Highlights */}
          <ul className="space-y-1.5">
            {highlights.map((h, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.07 }}
                className="flex items-center gap-2 font-body text-sm text-dark-gray"
              >
                <CheckCircle2 size={14} className={accentText} />
                {h}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* ── Receipt ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.55 }}
          className="bg-white rounded-2xl border border-border-light shadow-warm-md overflow-hidden mb-6"
        >
          {/* Receipt header */}
          <div className="bg-gradient-to-r from-amber to-amber-dark px-6 py-4 text-white">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 font-accent text-xs uppercase tracking-widest text-white/70">
                <Receipt size={13} />
                Subscription Receipt
              </span>
              <span className="font-accent text-xs text-white/60 uppercase tracking-wider">EventZen</span>
            </div>
            <p className="font-heading text-lg font-bold">{planName}</p>
            <p className="font-body text-sm text-white/70">{planTagline}</p>
          </div>

          {/* Transaction details */}
          <div className="px-6 py-4 border-b border-border-light space-y-2.5 bg-cream/40">
            <p className="font-accent text-[9px] uppercase tracking-widest text-muted-gray mb-1">Transaction Details</p>
            <div className="flex justify-between items-center">
              <span className="font-body text-sm text-muted-gray flex items-center gap-1.5"><Hash size={13} />Reference</span>
              <span className="font-mono text-sm font-semibold text-amber tracking-widest">{paymentRef}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body text-sm text-muted-gray">Date & Time</span>
              <span className="font-body text-sm font-medium text-near-black">{formatDateTime(purchasedAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body text-sm text-muted-gray">Payment Method</span>
              <span className="font-body text-sm font-medium text-near-black">{methodLabel(paymentMethod)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body text-sm text-muted-gray">Status</span>
              <span className="flex items-center gap-1 font-body text-sm font-semibold text-sage">
                <ShieldCheck size={13} />Verified
              </span>
            </div>
          </div>

          {/* Billing breakdown */}
          <div className="px-6 py-4">
            <p className="font-accent text-[9px] uppercase tracking-widest text-muted-gray mb-3">Billing Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-gray">Plan Price</span>
                <span className="text-near-black">{fmt(price)}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-gray">GST (18%)</span>
                <span className="text-muted-gray">{fmt(taxes)}</span>
              </div>
              <div className="flex justify-between font-heading text-base font-bold pt-2 border-t border-border-light">
                <span className="text-near-black">Total Paid</span>
                <span className="text-amber">{fmt(total)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Button fullWidth variant="primary" onClick={() => navigate("/events")} className="gap-2">
              <Ticket size={15} />
              Browse Events
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate("/customer/dashboard")} className="gap-2">
              Dashboard
              <ArrowRight size={15} />
            </Button>
          </div>
        </motion.div>

        <p className="font-body text-xs text-center text-muted-gray mt-5">
          Your discount is applied automatically at checkout.{" "}
          <Link to="/pricing" className="text-amber hover:underline">
            Manage subscription
          </Link>
        </p>
      </div>
    </PageTransition>
  );
}
