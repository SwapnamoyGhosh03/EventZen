import { useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Check, ArrowLeft, ShieldCheck, Lock,
  Smartphone, Building2, Eye, EyeOff,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useGetEventQuery } from "@/store/api/eventApi";
import { useGetTicketTypesQuery, useRegisterMutation, useGetMyRegistrationsQuery } from "@/store/api/ticketApi";
import { useMakePaymentMutation } from "@/store/api/paymentApi";
import { formatCurrency } from "@/utils/formatters";
import { useAuthContext } from "@/context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PayTab = "card" | "upi" | "netbanking";

function getCardBrand(num: string): string | null {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "VISA";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "MASTERCARD";
  if (/^6/.test(n)) return "RUPAY";
  if (/^3[47]/.test(n)) return "AMEX";
  return null;
}

function fmtCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function cardBg(brand: string | null) {
  if (brand === "VISA") return "from-[#1a1a2e] via-[#16213e] to-[#0f3460]";
  if (brand === "MASTERCARD") return "from-[#2d0000] via-[#6b0000] to-[#b22222]";
  if (brand === "RUPAY") return "from-[#0a2a0a] via-[#1a4a1a] to-[#1e6e1e]";
  if (brand === "AMEX") return "from-[#0a1a2e] via-[#1a3a5c] to-[#2a5a8c]";
  return "from-[#1E1E1E] via-[#2a2a2a] to-[#3a3a3a]";
}

const BANKS = [
  { id: "sbi", abbr: "SBI", name: "State Bank of India", bg: "bg-[#22409A]" },
  { id: "hdfc", abbr: "HDFC", name: "HDFC Bank", bg: "bg-[#004C8F]" },
  { id: "icici", abbr: "ICICI", name: "ICICI Bank", bg: "bg-[#B02A30]" },
  { id: "axis", abbr: "Axis", name: "Axis Bank", bg: "bg-[#97144D]" },
  { id: "kotak", abbr: "Kotak", name: "Kotak Mahindra", bg: "bg-[#EF3E42]" },
  { id: "pnb", abbr: "PNB", name: "Punjab National", bg: "bg-[#1C5FA8]" },
  { id: "bob", abbr: "BoB", name: "Bank of Baroda", bg: "bg-[#F37F20]" },
  { id: "canara", abbr: "CBK", name: "Canara Bank", bg: "bg-[#007DC5]" },
];

const UPI_APPS = [
  { id: "gpay", abbr: "G Pay", name: "Google Pay", tile: "bg-white border-2 border-gray-100", text: "text-gray-800" },
  { id: "phonepe", abbr: "PhonePe", name: "PhonePe", tile: "bg-[#5f259f]", text: "text-white" },
  { id: "paytm", abbr: "Paytm", name: "Paytm", tile: "bg-[#002970]", text: "text-white" },
  { id: "bhim", abbr: "BHIM", name: "BHIM UPI", tile: "bg-[#1d4ed8]", text: "text-white" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { id: eventId, ticketTypeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Steps: 1=Review  2=PayForm  3=Processing  4=Confirmed
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  // Payment form
  const [payTab, setPayTab] = useState<PayTab>("card");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cvvVisible, setCvvVisible] = useState(false);
  const [cvvFocused, setCvvFocused] = useState(false);
  const [upiApp, setUpiApp] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState("");
  const [processingMsg, setProcessingMsg] = useState("Initiating payment...");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const { user } = useAuthContext();
  const { data: event } = useGetEventQuery(eventId!);
  const { data: ticketTypesData } = useGetTicketTypesQuery(eventId!);
  const { data: myRegsData } = useGetMyRegistrationsQuery();
  const [registerTicket] = useRegisterMutation();
  const [makePayment] = useMakePaymentMutation();

  const canRegister = event?.status === "REGISTRATION_OPEN";
  const ticketTypes: any[] = ticketTypesData?.content || ticketTypesData || [];
  const myRegistrations: any[] = myRegsData?.content || myRegsData || [];

  // Parse cart: ?items=ticketTypeId:qty,ticketTypeId:qty  OR legacy /:ticketTypeId?qty=N
  const itemsParam = searchParams.get("items");
  const cartEntries: { id: string; qty: number }[] = itemsParam
    ? itemsParam.split(",").map((s) => { const [id, q] = s.split(":"); return { id, qty: parseInt(q) || 1 }; })
    : ticketTypeId
    ? [{ id: ticketTypeId, qty: Math.max(1, parseInt(searchParams.get("qty") || "1")) }]
    : [];

  const cartItems = cartEntries
    .map(({ id, qty }) => ({ ticketType: ticketTypes.find((t) => t.ticketTypeId === id || t.id === id), qty }))
    .filter((item) => item.ticketType != null) as { ticketType: any; qty: number }[];

  const subtotal = cartItems.reduce((s, { ticketType, qty }) => s + (ticketType.price ?? 0) * qty, 0);
  const taxes = subtotal > 0 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = subtotal + taxes;
  const isFree = subtotal === 0;
  const totalQty = cartItems.reduce((s, { qty }) => s + qty, 0);
  const brand = getCardBrand(cardNum);

  // Max-per-user validation against existing registrations
  function validateMaxPerUser(): string | null {
    for (const { ticketType, qty } of cartItems) {
      const ttId = ticketType.ticketTypeId || ticketType.id;
      const already = myRegistrations.filter(
        (r: any) => r.ticketTypeId === ttId || r.ticket?.ticketTypeId === ttId
      ).length;
      const maxPer = ticketType.maxPerUser ?? 10;
      if (already + qty > maxPer) {
        return `You already have ${already} ticket(s) for "${ticketType.name}". Max allowed is ${maxPer} per person.`;
      }
    }
    return null;
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validatePayForm(): string | null {
    if (payTab === "card") {
      if (cardNum.replace(/\s/g, "").length < 16) return "Enter a valid 16-digit card number.";
      if (!cardName.trim()) return "Enter the cardholder name.";
      if (expiry.length < 5) return "Enter a valid expiry date (MM/YY).";
      if (cvv.length < 3) return "Enter a valid CVV.";
    } else if (payTab === "upi") {
      if (!upiApp && !upiId.trim()) return "Select a UPI app or enter your UPI ID.";
      if (upiId.trim() && !upiId.includes("@")) return "Enter a valid UPI ID (e.g. name@upi).";
    } else if (payTab === "netbanking") {
      if (!bank) return "Select a bank to continue.";
    }
    return null;
  }

  // ── Registration helper ──────────────────────────────────────────────────────
  async function doRegister() {
    const ts = Date.now();
    for (const { ticketType, qty } of cartItems) {
      const resolvedId = ticketType.ticketTypeId || ticketType.id;
      for (let j = 0; j < qty; j++) {
        await registerTicket({
          data: {
            eventId,
            ticketTypeId: resolvedId,
            attendeeName: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
            attendeeEmail: user?.email,
            eventTitle: event?.title,
            eventDate: event?.startDate || (event as any)?.date,
            eventCity: event?.city,
          },
          idempotencyKey: `${eventId}-${resolvedId}-${ts}-${j}`,
        }).unwrap();
      }
    }
  }

  // ── Start processing animation ───────────────────────────────────────────────
  function startProcessing() {
    const msgs = [
      "Initiating secure payment...",
      "Verifying payment details...",
      "Authenticating with your bank...",
      "Confirming transaction...",
      "Registering your ticket...",
    ];
    let i = 0;
    setProcessingMsg(msgs[0]);
    intervalRef.current = setInterval(() => {
      i = (i + 1) % msgs.length;
      setProcessingMsg(msgs[i]);
    }, 900);
  }

  // ── Pay now (paid tickets) ───────────────────────────────────────────────────
  async function handlePayNow() {
    const limitErr = validateMaxPerUser();
    if (limitErr) { setError(limitErr); return; }
    const err = validatePayForm();
    if (err) { setError(err); return; }
    setError("");
    setStep(3);
    startProcessing();

    try {
      await makePayment({
        eventId,
        amount: total,
        description: `${totalQty} ticket(s) for ${event?.title || "event"}`,
      }).unwrap();
      await doRegister();
      clearInterval(intervalRef.current);
      const ref = Math.random().toString(36).slice(2, 10).toUpperCase() +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      navigate("/payment/success", {
        replace: true,
        state: {
          isFree: false,
          eventId,
          eventTitle: event?.title || "Event",
          eventCity: event?.city,
          eventDate: event?.startDate || (event as any)?.date,
          cartItems: cartItems.map(({ ticketType: tt, qty }) => ({
            name: tt.name,
            qty,
            price: tt.price ?? 0,
          })),
          subtotal,
          taxes,
          total,
          paymentMethod: payTab,
          paymentRef: ref,
          purchasedAt: new Date().toISOString(),
          totalQty,
        },
      });
    } catch (e: any) {
      clearInterval(intervalRef.current);
      setStep(2);
      setError(e?.data?.message || e?.data?.error?.message || "Payment failed. Please try again.");
    }
  }

  // ── Free registration ────────────────────────────────────────────────────────
  async function handleFreeRegister() {
    if (!canRegister) { setError("Registration is not open for this event."); return; }
    const limitErr = validateMaxPerUser();
    if (limitErr) { setError(limitErr); return; }
    setError("");
    setStep(3);
    setProcessingMsg("Registering your ticket...");

    try {
      await doRegister();
      navigate("/payment/success", {
        replace: true,
        state: {
          isFree: true,
          eventId,
          eventTitle: event?.title || "Event",
          eventCity: event?.city,
          eventDate: event?.startDate || (event as any)?.date,
          cartItems: cartItems.map(({ ticketType: tt, qty }) => ({
            name: tt.name,
            qty,
            price: tt.price ?? 0,
          })),
          subtotal: 0,
          taxes: 0,
          total: 0,
          purchasedAt: new Date().toISOString(),
          totalQty,
        },
      });
    } catch (e: any) {
      setStep(1);
      setError(e?.data?.message || "Registration failed. Please try again.");
    }
  }

  // ── Progress bar helpers ─────────────────────────────────────────────────────
  const progressLabels = ["Review", "Payment", "Confirmed"];
  const nodeState = (node: number) => {
    if (step === 4 && node < 3) return "done";
    if (step === 4 && node === 3) return "active";
    if (step === 3 && node === 2) return "active";
    if (step === 3 && node === 1) return "done";
    if (step > node) return "done";
    if (step === node) return "active";
    return "idle";
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto py-4 px-4">
        {/* Back button */}
        {(step === 1 || step === 2) && (
          <button
            onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
            className="inline-flex items-center gap-1.5 font-body text-sm text-muted-gray hover:text-amber transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            {step === 2 ? "Back to Review" : "Back"}
          </button>
        )}

        {/* Progress bar (hidden during processing) */}
        {step !== 3 && (
          <div className="flex items-center gap-2 mb-8 max-w-xs">
            {progressLabels.map((label, i) => {
              const state = nodeState(i + 1);
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-accent text-xs font-bold transition-all ${
                      state === "done"
                        ? "bg-sage text-white"
                        : state === "active"
                          ? "bg-amber text-white"
                          : "bg-border-light text-muted-gray"
                    }`}
                  >
                    {state === "done" ? <Check size={13} /> : i + 1}
                  </div>
                  <span className="font-body text-xs text-muted-gray hidden sm:block">{label}</span>
                  {i < 2 && (
                    <div
                      className={`flex-1 h-0.5 ${state === "done" ? "bg-sage" : "bg-border-light"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── STEP 1: ORDER REVIEW ─────────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card hover={false} padding="lg" className="max-w-lg mx-auto">
                <h2 className="font-heading text-2xl font-bold text-near-black mb-6">
                  Order Review
                </h2>

                {event && (
                  <div className="flex items-start gap-4 p-4 bg-cream rounded-lg mb-6">
                    <div className="w-12 h-12 bg-amber/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🎪</span>
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-near-black">
                        {event.title}
                      </h3>
                      <p className="font-body text-sm text-muted-gray">{event.city}</p>
                    </div>
                  </div>
                )}

                {cartItems.length > 0 && (
                  <div className="border-t border-border-light pt-4 space-y-3">
                    {/* Shared seatmap (show once if any tier has one) */}
                    {(() => {
                      const mapUrl = cartItems.find((c) => c.ticketType.seatMapImageUrl)?.ticketType.seatMapImageUrl;
                      return mapUrl ? (
                        <div className="rounded-lg overflow-hidden border border-border-light">
                          <p className="font-body text-xs text-muted-gray px-3 py-1.5 bg-cream border-b border-border-light">
                            Seating / Pricing Structure
                          </p>
                          <img src={mapUrl} alt="Seat map" className="w-full object-contain max-h-56" />
                        </div>
                      ) : null;
                    })()}
                    {/* Per-tier rows */}
                    {cartItems.map(({ ticketType: tt, qty: q }) => (
                      <div key={tt.ticketTypeId || tt.id} className="flex justify-between items-center">
                        <span className="font-body text-dark-gray">
                          {tt.name}
                          <span className="ml-2 text-xs text-muted-gray">× {q}</span>
                        </span>
                        <span className="font-body font-semibold text-near-black">
                          {tt.price === 0 ? "Free" : formatCurrency(tt.price * q)}
                        </span>
                      </div>
                    ))}
                    {/* Totals */}
                    {!isFree && (
                      <div className="flex justify-between text-sm text-muted-gray pt-1 border-t border-border-light">
                        <span className="font-body">Taxes & Fees (10%)</span>
                        <span className="font-body">{formatCurrency(taxes)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border-light">
                      <span className="font-heading text-lg font-bold text-near-black">Total</span>
                      <span className="font-heading text-lg font-bold text-amber">
                        {isFree ? "Free" : formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-6 p-3 bg-sage/10 rounded-lg">
                  <ShieldCheck size={18} className="text-sage" />
                  <span className="font-body text-sm text-sage">
                    Secure checkout · EventZen Pay
                  </span>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-lg font-body text-sm">
                    {error}
                  </div>
                )}

                {!canRegister && (
                  <div className="mt-4 p-3 bg-amber/10 border border-amber/30 text-near-black rounded-lg font-body text-sm">
                    Ticket sales open only when event status is REGISTRATION OPEN.
                  </div>
                )}

                <Button
                  fullWidth
                  onClick={isFree ? handleFreeRegister : () => { setError(""); setStep(2); }}
                  disabled={!canRegister}
                  className="mt-6 gap-2"
                >
                  <CreditCard size={18} />
                  {isFree
                    ? `Register${totalQty > 1 ? ` ×${totalQty}` : " Now"}`
                    : `Proceed to Payment${totalQty > 1 ? ` (×${totalQty})` : ""}`}
                </Button>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: PAYMENT PORTAL ───────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
                {/* ── LEFT: Order summary + security ── */}
                <div className="space-y-4">
                  {/* Dark order card */}
                  <div className="bg-near-black rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-6 h-6 rounded-full bg-amber flex items-center justify-center">
                        <Lock size={11} className="text-white" />
                      </div>
                      <span className="font-body text-[10px] text-white/60 tracking-widest uppercase">
                        EventZen Pay · Secured
                      </span>
                    </div>

                    <p className="font-body text-xs text-white/50 mb-1">Paying for</p>
                    <p className="font-heading text-base font-bold text-white mb-0.5 leading-tight">
                      {event?.title || "Event Ticket"}
                    </p>
                    <p className="font-body text-xs text-white/40">
                      {event?.city} · {totalQty} ticket{totalQty !== 1 ? "s" : ""}
                    </p>

                    <div className="mt-6 pt-5 border-t border-white/10">
                      <p className="font-body text-[10px] text-white/40 uppercase tracking-wider mb-1">
                        Total Amount
                      </p>
                      <p className="font-heading text-3xl font-bold text-amber">
                        {formatCurrency(total)}
                      </p>
                    </div>
                  </div>

                  {/* Security badges */}
                  <div className="bg-white border border-border-light rounded-xl p-4 space-y-3">
                    <p className="font-body text-[10px] text-muted-gray uppercase tracking-wider font-semibold mb-1">
                      Security
                    </p>
                    {[
                      { icon: ShieldCheck, label: "256-bit TLS Encryption" },
                      { icon: Lock, label: "PCI DSS Level 1 Compliant" },
                      { icon: ShieldCheck, label: "3D Secure Authenticated" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <Icon size={14} className="text-sage flex-shrink-0" />
                        <span className="font-body text-xs text-dark-gray">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── RIGHT: Payment form ── */}
                <div className="bg-white border border-border-light rounded-2xl overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
                    <h2 className="font-heading text-lg font-bold text-near-black">
                      Payment Details
                    </h2>
                    <div className="flex items-center gap-1.5 text-muted-gray">
                      <Lock size={12} />
                      <span className="font-body text-xs">SSL Secured</span>
                    </div>
                  </div>

                  {/* Tab bar */}
                  <div className="flex border-b border-border-light">
                    {(
                      [
                        { id: "card" as PayTab, icon: CreditCard, label: "Card" },
                        { id: "upi" as PayTab, icon: Smartphone, label: "UPI" },
                        { id: "netbanking" as PayTab, icon: Building2, label: "Net Banking" },
                      ] as const
                    ).map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => { setPayTab(id); setError(""); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-body text-sm transition-all border-b-2 ${
                          payTab === id
                            ? "border-amber text-amber font-semibold"
                            : "border-transparent text-muted-gray hover:text-dark-gray"
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {/* ── CARD TAB ── */}
                    {payTab === "card" && (
                      <div className="space-y-4">
                        {/* Animated card preview */}
                        <div
                          className={`relative rounded-2xl bg-gradient-to-br ${cardBg(brand)} p-5 text-white overflow-hidden h-44 mb-2 select-none`}
                        >
                          {/* Decorative circles */}
                          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/[0.04]" />
                          <div className="absolute -right-4 top-14 w-32 h-32 rounded-full bg-white/[0.06]" />

                          {/* Chip + brand */}
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex gap-0.5">
                              <div className="w-7 h-5 rounded-sm bg-amber/80" />
                              <div className="w-7 h-5 rounded-sm bg-amber/30 -ml-2" />
                            </div>
                            {brand && (
                              <span className="font-accent text-xs font-bold tracking-widest text-white/70 uppercase">
                                {brand}
                              </span>
                            )}
                          </div>

                          {/* Card number */}
                          <p className="font-mono text-[15px] tracking-[0.22em] text-white/90 mb-4">
                            {cvvFocused
                              ? "●●●● ●●●● ●●●● ●●●●"
                              : cardNum || "●●●● ●●●● ●●●● ●●●●"}
                          </p>

                          {/* Name + expiry/cvv */}
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="font-body text-[9px] text-white/40 uppercase tracking-wider mb-0.5">
                                Cardholder
                              </p>
                              <p className="font-body text-xs text-white/80 uppercase tracking-wide">
                                {cardName || "YOUR NAME"}
                              </p>
                            </div>
                            <div className="text-right">
                              {cvvFocused ? (
                                <div>
                                  <p className="font-body text-[9px] text-white/40 uppercase mb-0.5">CVV</p>
                                  <p className="font-mono text-xs text-white/80">
                                    {"●".repeat(cvv.length || 3)}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-body text-[9px] text-white/40 uppercase mb-0.5">
                                    Expires
                                  </p>
                                  <p className="font-body text-xs text-white/80">{expiry || "MM/YY"}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card number input */}
                        <div>
                          <label className="font-body text-xs font-semibold text-dark-gray mb-1.5 block">
                            Card Number
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="1234 5678 9012 3456"
                            value={cardNum}
                            onChange={(e) => setCardNum(fmtCard(e.target.value))}
                            className="w-full px-4 py-3 border border-border-light rounded-xl font-mono text-sm text-near-black focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/20 transition-all bg-white placeholder:text-muted-gray/50"
                          />
                        </div>

                        {/* Cardholder name */}
                        <div>
                          <label className="font-body text-xs font-semibold text-dark-gray mb-1.5 block">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            placeholder="Name as on card"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 border border-border-light rounded-xl font-body text-sm text-near-black focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/20 transition-all bg-white uppercase placeholder:normal-case placeholder:text-muted-gray/50"
                          />
                        </div>

                        {/* Expiry + CVV */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="font-body text-xs font-semibold text-dark-gray mb-1.5 block">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="MM / YY"
                              value={expiry}
                              onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                              className="w-full px-4 py-3 border border-border-light rounded-xl font-mono text-sm text-near-black focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/20 transition-all bg-white placeholder:text-muted-gray/50"
                            />
                          </div>
                          <div>
                            <label className="font-body text-xs font-semibold text-dark-gray mb-1.5 block">
                              CVV / CVC
                            </label>
                            <div className="relative">
                              <input
                                type={cvvVisible ? "text" : "password"}
                                inputMode="numeric"
                                placeholder="● ● ●"
                                value={cvv}
                                onChange={(e) =>
                                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                                }
                                onFocus={() => setCvvFocused(true)}
                                onBlur={() => setCvvFocused(false)}
                                className="w-full px-4 py-3 pr-10 border border-border-light rounded-xl font-mono text-sm text-near-black focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/20 transition-all bg-white"
                              />
                              <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setCvvVisible(!cvvVisible)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-gray hover:text-dark-gray"
                              >
                                {cvvVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── UPI TAB ── */}
                    {payTab === "upi" && (
                      <div className="space-y-5">
                        <p className="font-body text-xs text-muted-gray">
                          Select your preferred UPI app to pay
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          {UPI_APPS.map((app) => (
                            <button
                              key={app.id}
                              onClick={() => { setUpiApp(app.id); setUpiId(""); }}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                                upiApp === app.id
                                  ? "border-amber shadow-sm shadow-amber/20"
                                  : "border-border-light hover:border-amber/40"
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg ${app.tile} flex items-center justify-center flex-shrink-0`}
                              >
                                <Smartphone size={16} className={app.text} />
                              </div>
                              <div>
                                <p className="font-body text-xs font-semibold text-near-black">
                                  {app.abbr}
                                </p>
                                <p className="font-body text-[10px] text-muted-gray">{app.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-border-light" />
                          <span className="font-body text-[10px] text-muted-gray uppercase tracking-wider">
                            or enter UPI ID
                          </span>
                          <div className="flex-1 h-px bg-border-light" />
                        </div>

                        <div>
                          <label className="font-body text-xs font-semibold text-dark-gray mb-1.5 block">
                            UPI ID
                          </label>
                          <input
                            type="text"
                            placeholder="yourname@okicici"
                            value={upiId}
                            onChange={(e) => { setUpiId(e.target.value); setUpiApp(""); }}
                            className="w-full px-4 py-3 border border-border-light rounded-xl font-body text-sm text-near-black focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/20 transition-all bg-white placeholder:text-muted-gray/50"
                          />
                          <p className="font-body text-[10px] text-muted-gray mt-1.5">
                            Format: username@bankname · e.g. swapnil@okicici
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── NET BANKING TAB ── */}
                    {payTab === "netbanking" && (
                      <div className="space-y-4">
                        <p className="font-body text-xs text-muted-gray">Select your bank</p>
                        <div className="grid grid-cols-2 gap-2">
                          {BANKS.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => setBank(b.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                bank === b.id
                                  ? "border-amber bg-amber/5"
                                  : "border-border-light hover:border-amber/40 bg-white"
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg ${b.bg} flex items-center justify-center flex-shrink-0`}
                              >
                                <span className="font-accent text-[9px] font-bold text-white leading-none">
                                  {b.abbr}
                                </span>
                              </div>
                              <span className="font-body text-xs text-near-black leading-tight">
                                {b.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="mt-4 p-3 bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-xl font-body text-sm">
                        {error}
                      </div>
                    )}

                    {/* Pay button */}
                    <Button fullWidth onClick={handlePayNow} className="mt-5 gap-2 h-12 text-base">
                      <Lock size={15} />
                      Pay {formatCurrency(total)} Securely
                    </Button>

                    <p className="font-body text-[10px] text-center text-muted-gray mt-3 leading-relaxed">
                      By proceeding you agree to EventZen's payment terms.
                      <br />
                      Your information is encrypted and never stored.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: PROCESSING ───────────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24"
            >
              {/* Animated ring */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full border-4 border-border-light border-t-amber animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock size={22} className="text-amber" />
                </div>
              </div>

              <h2 className="font-heading text-2xl font-bold text-near-black mb-2">
                Processing Payment
              </h2>
              <motion.p
                key={processingMsg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-body text-dark-gray mb-8 text-center"
              >
                {processingMsg}
              </motion.p>

              <div className="flex items-center gap-2 text-muted-gray">
                <ShieldCheck size={14} />
                <span className="font-body text-xs">256-bit encrypted · Do not close this page</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
