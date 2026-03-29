import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Download, Ticket, Calendar, MapPin,
  Receipt, ShieldCheck, ArrowRight, Hash,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatters";
import { downloadElementAsPDF } from "@/utils/downloadPDF";

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "bg-amber", "bg-sage", "bg-burgundy", "bg-blush",
  "bg-dusty-blue", "bg-terracotta", "bg-amber/70", "bg-sage/70",
];

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

interface CartItem {
  name: string;
  qty: number;
  price: number;
}

export interface PaymentSuccessState {
  isFree: boolean;
  eventId: string;
  eventTitle: string;
  eventCity?: string;
  eventDate?: string;
  cartItems: CartItem[];
  subtotal: number;
  taxes: number;
  total: number;
  paymentMethod?: string;
  paymentRef?: string;
  purchasedAt: string;
  totalQty: number;
}

function methodLabel(m?: string) {
  if (!m) return "—";
  if (m === "card") return "Credit / Debit Card";
  if (m === "upi") return "UPI";
  if (m === "netbanking") return "Net Banking";
  return m;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3800);
    return () => clearTimeout(t);
  }, []);

  const confettiParticles = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    delay: i * 0.055,
    x: Math.round((i / 36) * 100) + (Math.random() * 6 - 3),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  const state = location.state as PaymentSuccessState | null;

  async function handleDownload() {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const slug = (state?.eventTitle || "event").replace(/\s+/g, "-").toLowerCase();
      await downloadElementAsPDF(
        receiptRef.current,
        `eventzen-${state?.isFree ? "registration" : "payment"}-${slug}.pdf`
      );
    } finally {
      setDownloading(false);
    }
  }

  // Guard: if user navigates here directly without state
  if (!state) {
    return (
      <PageTransition>
        <div className="max-w-lg mx-auto py-20 text-center">
          <p className="font-body text-muted-gray mb-6">No payment details found.</p>
          <Button onClick={() => navigate("/my/tickets")}>View My Tickets</Button>
        </div>
      </PageTransition>
    );
  }

  const {
    isFree, eventTitle, eventCity, eventDate,
    cartItems, subtotal, taxes, total,
    paymentMethod, paymentRef, purchasedAt, totalQty,
  } = state;

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

        {/* Success header */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="text-center mb-8"
        >
          {/* Animated ring + icon */}
          <div className="relative w-24 h-24 mx-auto mb-5">
            <motion.div
              className="absolute inset-0 rounded-full bg-sage/20"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-sage/15"
              animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
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
            {isFree ? "You're Registered!" : "Payment Successful!"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="font-body text-dark-gray"
          >
            {isFree
              ? "Your registration is confirmed. Check your wallet for the QR pass."
              : `${formatCurrency(total)} paid. Your tickets are ready in your wallet.`}
          </motion.p>
        </motion.div>

        {/* ── Receipt card (captured for PDF) ── */}
        <div ref={receiptRef} className="bg-white rounded-2xl border border-border-light shadow-warm-md overflow-hidden">

          {/* Receipt header */}
          <div className="bg-gradient-to-r from-amber to-amber-dark px-6 py-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-white/70" />
                <span className="font-accent text-xs uppercase tracking-widest text-white/70">
                  {isFree ? "Registration Receipt" : "Payment Receipt"}
                </span>
              </div>
              <span className="font-accent text-xs text-white/60 uppercase tracking-wider">
                EventZen
              </span>
            </div>
            <h2 className="font-heading text-xl font-bold mb-1">{eventTitle}</h2>
            <div className="flex flex-wrap gap-4 text-white/75 text-sm font-body">
              {eventCity && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {eventCity}
                </span>
              )}
              {eventDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {formatDateShort(eventDate)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Ticket size={13} />
                {totalQty} ticket{totalQty !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Transaction details */}
          {!isFree && (
            <div className="px-6 py-4 bg-cream/50 border-b border-border-light space-y-2.5">
              <p className="font-accent text-[9px] uppercase tracking-widest text-muted-gray mb-1">
                Transaction Details
              </p>
              {paymentRef && (
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm text-muted-gray flex items-center gap-1.5">
                    <Hash size={13} />
                    Reference
                  </span>
                  <span className="font-mono text-sm font-semibold text-amber tracking-widest">
                    {paymentRef}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-gray">Date & Time</span>
                <span className="font-body text-sm font-medium text-near-black">
                  {formatDateTime(purchasedAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-gray">Payment Method</span>
                <span className="font-body text-sm font-medium text-near-black">
                  {methodLabel(paymentMethod)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-muted-gray">Status</span>
                <span className="flex items-center gap-1 font-body text-sm font-semibold text-sage">
                  <ShieldCheck size={13} />
                  Verified
                </span>
              </div>
            </div>
          )}

          {/* Order breakdown */}
          <div className="px-6 py-4 border-b border-border-light space-y-0">
            <p className="font-accent text-[9px] uppercase tracking-widest text-muted-gray mb-3">
              Order Summary
            </p>
            {cartItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-t border-border-light first:border-0">
                <span className="font-body text-sm text-dark-gray">
                  {item.name}
                  <span className="ml-1.5 text-xs text-muted-gray">× {item.qty}</span>
                </span>
                <span className="font-body text-sm font-medium text-near-black">
                  {item.price === 0 ? "Free" : formatCurrency(item.price * item.qty)}
                </span>
              </div>
            ))}
            {!isFree && subtotal > 0 && (
              <div className="flex justify-between items-center py-2.5 border-t border-border-light">
                <span className="font-body text-sm text-muted-gray">Taxes & Fees (10%)</span>
                <span className="font-body text-sm text-muted-gray">{formatCurrency(taxes)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-t border-border-light mt-1">
              <span className="font-heading text-base font-bold text-near-black">Total</span>
              <span className="font-heading text-xl font-bold text-amber">
                {isFree ? "Free" : formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Footer stub */}
          <div className="px-6 py-3 flex items-center justify-between">
            <p className="font-body text-xs text-muted-gray">
              {formatDateTime(purchasedAt)}
            </p>
            <p className="font-body text-xs text-muted-gray">EventZen · Secure Pay</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button
            fullWidth
            onClick={handleDownload}
            isLoading={downloading}
            variant="secondary"
            className="gap-2"
          >
            <Download size={16} />
            {downloading ? "Generating PDF…" : "Download Receipt PDF"}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              fullWidth
              variant="primary"
              onClick={() => navigate("/my/tickets")}
              className="gap-2"
            >
              <Ticket size={15} />
              My Tickets
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => navigate("/events")}
              className="gap-2"
            >
              Browse Events
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>

        {/* Wallet hint */}
        <p className="font-body text-xs text-center text-muted-gray mt-5">
          Your QR pass{totalQty !== 1 ? "es are" : " is"} ready in{" "}
          <Link to="/my/tickets" className="text-amber hover:underline">
            My Tickets
          </Link>
          . Show it at check-in.
        </p>
      </div>
    </PageTransition>
  );
}
