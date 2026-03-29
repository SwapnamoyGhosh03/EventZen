import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Check, ArrowLeft, ShieldCheck, Lock,
  Smartphone, Building2, Eye, EyeOff,
  Sparkles, Zap, Crown, Ticket, Gift, Clock, Star,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuthContext } from "@/context/AuthContext";

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS: Record<string, {
  id: string; name: string; tagline: string; price: number;
  Icon: React.ElementType; accentBg: string; accentText: string;
  highlights: string[];
}> = {
  starter: {
    id: "starter", name: "ZenStarter", tagline: "Perfect for casual event-goers",
    price: 499, Icon: Sparkles, accentBg: "bg-sage/15", accentText: "text-sage",
    highlights: ["5% discount on every booking", "12-hr early access", "Email support"],
  },
  pro: {
    id: "pro", name: "ZenPro", tagline: "For the regular event enthusiast",
    price: 1499, Icon: Zap, accentBg: "bg-amber/15", accentText: "text-amber",
    highlights: ["15% discount on every booking", "48-hr early access", "Waitlist priority", "Member-only events"],
  },
  max: {
    id: "max", name: "ZenMax", tagline: "The ultimate VIP experience",
    price: 2999, Icon: Crown, accentBg: "bg-burgundy/15", accentText: "text-burgundy",
    highlights: ["25% discount on every booking", "1 free ticket every 3rd event", "72-hr first access", "VIP phone support"],
  },
};

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
  { id: "sbi",    abbr: "SBI",   name: "State Bank of India",   bg: "bg-[#22409A]" },
  { id: "hdfc",   abbr: "HDFC",  name: "HDFC Bank",             bg: "bg-[#004C8F]" },
  { id: "icici",  abbr: "ICICI", name: "ICICI Bank",            bg: "bg-[#B02A30]" },
  { id: "axis",   abbr: "Axis",  name: "Axis Bank",             bg: "bg-[#97144D]" },
  { id: "kotak",  abbr: "Kotak", name: "Kotak Mahindra",        bg: "bg-[#EF3E42]" },
  { id: "pnb",    abbr: "PNB",   name: "Punjab National",       bg: "bg-[#1C5FA8]" },
  { id: "bob",    abbr: "BoB",   name: "Bank of Baroda",        bg: "bg-[#F37F20]" },
  { id: "canara", abbr: "CBK",   name: "Canara Bank",           bg: "bg-[#007DC5]" },
];
const UPI_APPS = [
  { id: "gpay",    abbr: "G Pay",   tile: "bg-white border-2 border-gray-100", text: "text-gray-800" },
  { id: "phonepe", abbr: "PhonePe", tile: "bg-[#5f259f]",                      text: "text-white" },
  { id: "paytm",   abbr: "Paytm",   tile: "bg-[#002970]",                      text: "text-white" },
  { id: "bhim",    abbr: "BHIM",    tile: "bg-[#1d4ed8]",                      text: "text-white" },
];

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionCheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const plan = PLANS[planId?.toLowerCase() ?? ""] ?? PLANS.starter;
  const { Icon } = plan;

  const taxes = Math.round(plan.price * 0.18); // 18% GST
  const total = plan.price + taxes;

  // Steps: 1=Review  2=PayForm  3=Processing
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [payTab, setPayTab] = useState<PayTab>("card");

  // Card fields
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cvvVisible, setCvvVisible] = useState(false);
  const [cvvFocused, setCvvFocused] = useState(false);

  // UPI
  const [upiApp, setUpiApp] = useState("");
  const [upiId, setUpiId] = useState("");

  // Net banking
  const [bank, setBank] = useState("");

  const [processingMsg, setProcessingMsg] = useState("Initiating payment...");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const brand = getCardBrand(cardNum);

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

  function startProcessing() {
    const msgs = [
      "Initiating secure payment...",
      "Verifying payment details...",
      "Authenticating with your bank...",
      "Confirming transaction...",
      "Activating your subscription...",
    ];
    let i = 0;
    setProcessingMsg(msgs[0]);
    intervalRef.current = setInterval(() => {
      i = (i + 1) % msgs.length;
      setProcessingMsg(msgs[i]);
    }, 900);
  }

  async function handlePayNow() {
    const err = validatePayForm();
    if (err) { setError(err); return; }
    setError("");
    setStep(3);
    startProcessing();

    // Simulate network delay (2s)
    await new Promise((r) => setTimeout(r, 2000));
    clearInterval(intervalRef.current);

    const ref =
      Math.random().toString(36).slice(2, 10).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase();

    navigate("/subscription/success", {
      replace: true,
      state: {
        planId: plan.id,
        planName: plan.name,
        planTagline: plan.tagline,
        price: plan.price,
        taxes,
        total,
        paymentMethod: payTab,
        paymentRef: ref,
        purchasedAt: new Date().toISOString(),
        highlights: plan.highlights,
      },
    });
  }

  const progressLabels = ["Review", "Payment", "Confirmed"];
  const nodeState = (node: number) => {
    if (step > node) return "done";
    if (step === node) return "active";
    return "idle";
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto py-4 px-4">
        {(step === 1 || step === 2) && (
          <button
            onClick={() => (step === 2 ? setStep(1) : navigate("/pricing"))}
            className="inline-flex items-center gap-1.5 font-body text-sm text-muted-gray hover:text-amber transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            {step === 2 ? "Back to Review" : "Back to Pricing"}
          </button>
        )}

        {/* Progress */}
        {step !== 3 && (
          <div className="flex items-center gap-2 mb-8 max-w-xs">
            {progressLabels.map((label, i) => {
              const state = nodeState(i + 1);
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-accent text-xs font-bold transition-all ${state === "done" ? "bg-sage text-white" : state === "active" ? "bg-amber text-white" : "bg-border-light text-muted-gray"}`}>
                    {state === "done" ? <Check size={13} /> : i + 1}
                  </div>
                  <span className="font-body text-xs text-muted-gray hidden sm:block">{label}</span>
                  {i < 2 && <div className={`flex-1 h-0.5 ${state === "done" ? "bg-sage" : "bg-border-light"}`} />}
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── STEP 1: REVIEW ── */}
          {step === 1 && (
            <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card hover={false} padding="lg" className="max-w-lg mx-auto">
                <h2 className="font-heading text-2xl font-bold text-near-black mb-6">Order Review</h2>

                {/* Plan card */}
                <div className={`flex items-center gap-4 p-4 ${plan.accentBg} rounded-xl mb-6`}>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-warm-sm shrink-0">
                    <Icon size={22} className={plan.accentText} />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold text-near-black leading-tight">{plan.name}</p>
                    <p className="font-body text-sm text-muted-gray">{plan.tagline}</p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="font-heading text-xl font-bold text-near-black">{fmt(plan.price)}</p>
                    <p className="font-body text-xs text-muted-gray">/month</p>
                  </div>
                </div>

                {/* Highlights */}
                <ul className="space-y-2 mb-6">
                  {plan.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2.5 font-body text-sm text-dark-gray">
                      <Check size={14} className={plan.accentText} strokeWidth={2.5} />
                      {h}
                    </li>
                  ))}
                </ul>

                {/* Billing breakdown */}
                <div className="border-t border-border-light pt-4 space-y-2.5 mb-6">
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-dark-gray">Plan Price</span>
                    <span className="text-near-black">{fmt(plan.price)}</span>
                  </div>
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-muted-gray">GST (18%)</span>
                    <span className="text-muted-gray">{fmt(taxes)}</span>
                  </div>
                  <div className="flex justify-between font-heading text-base font-bold pt-1 border-t border-border-light">
                    <span className="text-near-black">Total (this month)</span>
                    <span className="text-amber">{fmt(total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-sage/10 rounded-lg mb-6">
                  <ShieldCheck size={18} className="text-sage" />
                  <span className="font-body text-sm text-sage">Secure checkout · EventZen Pay</span>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-lg font-body text-sm">{error}</div>
                )}

                <Button fullWidth onClick={() => { setError(""); setStep(2); }} className="gap-2">
                  <CreditCard size={18} />
                  Proceed to Payment
                </Button>
              </Card>
            </motion.div>
          )}

          {/* ── STEP 2: PAYMENT FORM ── */}
          {step === 2 && (
            <motion.div key="pay" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Left: payment form */}
                <div className="lg:col-span-3">
                  <Card hover={false} padding="lg">
                    <h2 className="font-heading text-xl font-bold text-near-black mb-5">Payment Details</h2>

                    {/* Tab switcher */}
                    <div className="flex rounded-xl border border-border-light overflow-hidden mb-6">
                      {(["card", "upi", "netbanking"] as PayTab[]).map((tab) => {
                        const icons = { card: CreditCard, upi: Smartphone, netbanking: Building2 };
                        const labels = { card: "Card", upi: "UPI", netbanking: "Net Banking" };
                        const TabIcon = icons[tab];
                        return (
                          <button
                            key={tab}
                            onClick={() => setPayTab(tab)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-body text-sm font-medium transition-colors ${payTab === tab ? "bg-amber text-white" : "text-muted-gray hover:bg-cream"}`}
                          >
                            <TabIcon size={15} />
                            <span className="hidden sm:inline">{labels[tab]}</span>
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      {/* ── CARD ── */}
                      {payTab === "card" && (
                        <motion.div key="card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          {/* 3D card preview */}
                          <div className={`relative bg-gradient-to-br ${cardBg(brand)} rounded-2xl p-5 mb-6 h-40 overflow-hidden select-none`}>
                            <div className="absolute top-4 right-5 text-white/60 font-accent font-bold text-sm tracking-widest">{brand ?? "CARD"}</div>
                            <div className="absolute bottom-12 left-5 right-5">
                              <p className="font-mono text-white text-lg tracking-[0.25em] mb-2">
                                {(cardNum || "•••• •••• •••• ••••").padEnd(19, "•")}
                              </p>
                            </div>
                            <div className="absolute bottom-4 left-5 right-5 flex justify-between">
                              <div>
                                <p className="font-accent text-white/50 text-[9px] uppercase">Cardholder</p>
                                <p className="font-mono text-white text-sm tracking-wider truncate max-w-[140px]">
                                  {cardName || "FULL NAME"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-accent text-white/50 text-[9px] uppercase">Expires</p>
                                <p className="font-mono text-white text-sm">{expiry || "MM/YY"}</p>
                              </div>
                            </div>
                            <AnimatePresence>
                              {cvvFocused && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className="absolute inset-0 bg-near-black/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                  <div className="text-center">
                                    <p className="font-accent text-white/60 text-xs uppercase mb-2">CVV</p>
                                    <p className="font-mono text-white text-3xl tracking-[0.5em]">{"•".repeat(cvv.length || 3)}</p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="font-body text-xs text-muted-gray block mb-1">Card Number</label>
                              <input value={cardNum} onChange={(e) => setCardNum(fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19}
                                className="w-full border border-border-light rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-amber transition-colors" />
                            </div>
                            <div>
                              <label className="font-body text-xs text-muted-gray block mb-1">Cardholder Name</label>
                              <input value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} placeholder="AS ON CARD"
                                className="w-full border border-border-light rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-amber transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="font-body text-xs text-muted-gray block mb-1">Expiry</label>
                                <input value={expiry} onChange={(e) => setExpiry(fmtExpiry(e.target.value))} placeholder="MM/YY" maxLength={5}
                                  className="w-full border border-border-light rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-amber transition-colors" />
                              </div>
                              <div>
                                <label className="font-body text-xs text-muted-gray block mb-1">CVV</label>
                                <div className="relative">
                                  <input
                                    type={cvvVisible ? "text" : "password"}
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    onFocus={() => setCvvFocused(true)}
                                    onBlur={() => setCvvFocused(false)}
                                    placeholder="•••"
                                    maxLength={4}
                                    className="w-full border border-border-light rounded-lg px-3 py-2.5 font-mono text-sm pr-9 focus:outline-none focus:border-amber transition-colors"
                                  />
                                  <button type="button" onClick={() => setCvvVisible((v) => !v)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-gray hover:text-near-black transition-colors">
                                    {cvvVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── UPI ── */}
                      {payTab === "upi" && (
                        <motion.div key="upi" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          <p className="font-body text-sm text-muted-gray mb-3">Choose a UPI app</p>
                          <div className="grid grid-cols-4 gap-3 mb-5">
                            {UPI_APPS.map((app) => (
                              <button key={app.id} onClick={() => setUpiApp(app.id)}
                                className={`${app.tile} ${app.text} rounded-xl p-3 text-center font-accent text-xs font-bold transition-all ${upiApp === app.id ? "ring-2 ring-amber scale-105" : "opacity-80 hover:opacity-100"}`}>
                                {app.abbr}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-px flex-1 bg-border-light" />
                            <span className="font-body text-xs text-muted-gray">or enter UPI ID</span>
                            <div className="h-px flex-1 bg-border-light" />
                          </div>
                          <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi"
                            className="w-full border border-border-light rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-amber transition-colors" />
                        </motion.div>
                      )}

                      {/* ── NET BANKING ── */}
                      {payTab === "netbanking" && (
                        <motion.div key="nb" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          <p className="font-body text-sm text-muted-gray mb-3">Select your bank</p>
                          <div className="grid grid-cols-4 gap-3">
                            {BANKS.map((b) => (
                              <button key={b.id} onClick={() => setBank(b.id)}
                                className={`${b.bg} text-white rounded-xl p-3 text-center font-accent text-xs font-bold transition-all ${bank === b.id ? "ring-2 ring-amber ring-offset-1 scale-105" : "opacity-80 hover:opacity-100"}`}>
                                {b.abbr}
                              </button>
                            ))}
                          </div>
                          {bank && (
                            <p className="font-body text-xs text-muted-gray mt-3">
                              Selected: <span className="font-medium text-near-black">{BANKS.find((b) => b.id === bank)?.name}</span>
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && (
                      <div className="mt-4 p-3 bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-lg font-body text-sm">{error}</div>
                    )}

                    <div className="flex items-center gap-2 mt-5 p-3 bg-cream rounded-lg">
                      <Lock size={14} className="text-muted-gray" />
                      <span className="font-body text-xs text-muted-gray">256-bit SSL encrypted · PCI DSS compliant</span>
                    </div>

                    <Button fullWidth onClick={handlePayNow} className="mt-5 gap-2">
                      <ShieldCheck size={17} />
                      Pay {fmt(total)} Securely
                    </Button>
                  </Card>
                </div>

                {/* Right: order summary */}
                <div className="lg:col-span-2">
                  <Card hover={false} padding="lg">
                    <h3 className="font-heading font-semibold text-near-black mb-4">Summary</h3>
                    <div className={`flex items-center gap-3 p-3 ${plan.accentBg} rounded-xl mb-4`}>
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0">
                        <Icon size={18} className={plan.accentText} />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-near-black text-sm">{plan.name}</p>
                        <p className="font-body text-xs text-muted-gray">Monthly subscription</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between font-body text-sm">
                        <span className="text-muted-gray">Plan</span>
                        <span className="text-near-black">{fmt(plan.price)}</span>
                      </div>
                      <div className="flex justify-between font-body text-sm">
                        <span className="text-muted-gray">GST (18%)</span>
                        <span className="text-muted-gray">{fmt(taxes)}</span>
                      </div>
                      <div className="flex justify-between font-heading text-base font-bold pt-2 border-t border-border-light">
                        <span>Total</span>
                        <span className="text-amber">{fmt(total)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {plan.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 font-body text-xs text-dark-gray">
                          <Check size={12} className={plan.accentText} strokeWidth={2.5} />
                          {h}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: PROCESSING ── */}
          {step === 3 && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24">
              <div className="relative mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full border-4 border-border-light border-t-amber"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck size={22} className="text-amber" />
                </div>
              </div>
              <p className="font-heading text-xl font-semibold text-near-black mb-2">Processing Payment</p>
              <motion.p
                key={processingMsg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-body text-sm text-muted-gray"
              >
                {processingMsg}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
