import { useMemo, useState } from "react";
import {
  IndianRupee, TrendingUp, Receipt, CreditCard,
  Loader2, RefreshCw, Building2, Percent, BarChart3, Handshake,
  ChevronDown, ChevronUp, Users, Filter, Tag,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useListEventsQuery } from "@/store/api/eventApi";
import { useListUsersQuery } from "@/store/api/authApi";
import {
  useGetAdminRevenueQuery,
} from "@/store/api/paymentApi";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | undefined | null) =>
  n != null
    ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "₹0.00";

const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

function ProgressBar({ value, color = "bg-sage" }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-border-light rounded-full h-1.5 mt-1">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ── Filter Select ─────────────────────────────────────────────────────────────
function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Filter size={11} className="text-muted-gray flex-shrink-0" />
      <span className="font-body text-[10px] text-muted-gray whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[11px] border border-border-light rounded-md px-2 py-1 font-body bg-white focus:outline-none focus:border-amber max-w-[160px] truncate"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Section Toggle ────────────────────────────────────────────────────────────
function SectionToggle({
  open, onToggle, count,
}: {
  open: boolean; onToggle: () => void; count?: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 font-body text-[10px] text-amber hover:text-amber-dark transition-colors mt-2"
    >
      {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      {open ? "Hide" : `Show ${count != null ? count + " " : ""}details`}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminFinancePage() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: eventsData } = useListEventsQuery({ size: 200 });
  const { data: usersData } = useListUsersQuery({ size: 200 });
  const { data: adminRevenue, isLoading: revenueLoading, refetch } = useGetAdminRevenueQuery();

  const events: any[] = useMemo(
    () => (Array.isArray(eventsData?.content) ? eventsData.content : Array.isArray(eventsData) ? eventsData : []),
    [eventsData]
  );

  const users: any[] = useMemo(
    () => (usersData?.data ?? usersData ?? []),
    [usersData]
  );

  // ── Lookup maps ───────────────────────────────────────────────────────────
  const eventMap = useMemo(
    () => new Map(events.map((e) => [e.eventId ?? e.id, e])),
    [events]
  );
  const userMap = useMemo(
    () => new Map(users.map((u: any) => [u.userId ?? u.id, u])),
    [users]
  );

  const userName = (id: string) => {
    const u = userMap.get(id);
    if (!u) return id ? id.slice(0, 8) + "…" : "—";
    return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || id.slice(0, 8) + "…";
  };
  const eventName = (id: string) => eventMap.get(id)?.title ?? id?.slice(0, 10) + "…";

  const r = adminRevenue;

  // ── Section expand state ──────────────────────────────────────────────────
  const [ticketOpen,  setTicketOpen]  = useState(true);
  const [orgFeeOpen,  setOrgFeeOpen]  = useState(true);
  const [venueOpen,   setVenueOpen]   = useState(true);
  const [vendorOpen,  setVendorOpen]  = useState(true);
  const [sponsorOpen, setSponsorOpen] = useState(true);
  const [catOpen,     setCatOpen]     = useState(true);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [tkEventFilter,  setTkEventFilter]  = useState("all");
  const [tkVendorFilter, setTkVendorFilter] = useState("all");
  const [ofVendorFilter, setOfVendorFilter] = useState("all");
  const [vbEventFilter,  setVbEventFilter]  = useState("all");
  // ── Derived data ──────────────────────────────────────────────────────────
  const ticketRows: any[] = useMemo(() => {
    let rows = r?.eventPaymentBreakdown ?? [];
    if (tkEventFilter !== "all") rows = rows.filter((d: any) => d.eventId === tkEventFilter);
    if (tkVendorFilter !== "all")
      rows = rows.filter((d: any) => eventMap.get(d.eventId)?.organizerId === tkVendorFilter);
    return rows;
  }, [r, tkEventFilter, tkVendorFilter, eventMap]);

  const orgFeeRows: any[] = useMemo(() => {
    let rows = r?.eventOrgFeeByEvent ?? [];
    if (ofVendorFilter !== "all") rows = rows.filter((d: any) => d.organizerId === ofVendorFilter);
    return rows;
  }, [r, ofVendorFilter]);

  const venueRows: any[] = useMemo(() => {
    let rows = r?.venueBudgetByEvent ?? [];
    if (vbEventFilter !== "all") rows = rows.filter((d: any) => d.eventId === vbEventFilter);
    return rows;
  }, [r, vbEventFilter]);

  // Unique vendors from budget data
  const vendorOptions = useMemo(() => {
    const ids = new Set<string>([
      ...(r?.eventOrgFeeByEvent ?? []).map((e: any) => e.organizerId),
      ...(r?.vendorBreakdown ?? []).map((v: any) => v.vendorId),
    ]);
    return [
      { value: "all", label: "All Vendors" },
      ...[...ids].filter(Boolean).map((id) => ({ value: id, label: userName(id) })),
    ];
  }, [r, userMap]);

  const eventOptions = useMemo(() => [
    { value: "all", label: "All Events" },
    ...(r?.eventPaymentBreakdown ?? []).map((e: any) => ({
      value: e.eventId,
      label: eventName(e.eventId),
    })),
  ], [r, eventMap]);

  const venueEventOptions = useMemo(() => [
    { value: "all", label: "All Events" },
    ...(r?.venueBudgetByEvent ?? []).map((e: any) => ({
      value: e.eventId,
      label: eventName(e.eventId),
    })),
  ], [r, eventMap]);

  // Category colours
  const CAT_COLORS: Record<string, string> = {
    VENUE: "bg-dusty-blue", CATERING: "bg-amber", AV: "bg-sage",
    MARKETING: "bg-burgundy", STAFF: "bg-[#9b59b6]", DECOR: "bg-[#e67e22]",
    SECURITY: "bg-[#e74c3c]", LOGISTICS: "bg-[#1abc9c]", OTHER: "bg-muted-gray",
  };

  const catTotal = (r?.categoryBreakdown ?? []).reduce(
    (s: number, c: any) => s + (c.totalEstimated ?? 0), 0
  );

  // ── KPI cards ─────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: "Ticket Commission (20%)",
      value: fmt(r?.ticketCommission),
      sub: `${fmt(r?.totalTicketSales)} in sales · ${(r?.eventPaymentBreakdown ?? []).reduce((s: number, e: any) => s + e.paymentCount, 0)} txns`,
      icon: Percent,
      cls: "bg-sage/10 text-sage",
    },
    {
      label: "Event Organisation Fees",
      value: fmt(r?.eventFees),
      sub: `${r?.uniqueEventCount ?? 0} events × ₹25,000`,
      icon: BarChart3,
      cls: "bg-amber/10 text-amber",
    },
    {
      label: "Venue Commission (25%)",
      value: fmt(r?.venueCommission),
      sub: `${fmt(r?.totalVenueBudget)} venue budget`,
      icon: Building2,
      cls: "bg-dusty-blue/10 text-dusty-blue",
    },
    {
      label: "Total Admin Earnings",
      value: fmt(r?.totalAdminRevenue),
      sub: "Commission + fees + venue",
      icon: IndianRupee,
      cls: "bg-near-black text-white",
      dark: true,
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-xs text-amber uppercase tracking-widest mb-1">ADMIN PORTAL</p>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
              Platform Revenue Dashboard
            </h1>
            <p className="font-body text-dark-gray text-sm">
              Ticket commissions · event fees · venue revenue — per event, per vendor.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 flex-shrink-0" onClick={() => refetch()}>
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        {revenueLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-border-light rounded-lg p-5 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-border-light/60 mb-3" />
                <div className="h-3 bg-border-light/60 rounded w-3/4 mb-2" />
                <div className="h-6 bg-border-light/60 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((c) => (
              <div
                key={c.label}
                className={`border border-border-light rounded-lg p-5 ${c.dark ? "bg-near-black" : "bg-white"}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.cls}`}>
                  <c.icon size={18} />
                </div>
                <p className={`font-body text-xs ${c.dark ? "text-white/60" : "text-muted-gray"}`}>{c.label}</p>
                <p className={`font-heading text-xl font-bold mt-0.5 ${c.dark ? "text-white" : "text-near-black"}`}>
                  {c.value}
                </p>
                <p className={`font-body text-[10px] mt-1 ${c.dark ? "text-white/40" : "text-muted-gray"}`}>
                  {c.sub}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION A — Ticket Sales Commission
        ══════════════════════════════════════════════════════════════════ */}
        <Card hover={false} padding="none">
          <div className="px-6 py-4 border-b border-border-light">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-7 h-7 rounded-lg bg-sage/10 flex items-center justify-center">
                    <Percent size={14} className="text-sage" />
                  </div>
                  <h2 className="font-heading text-base font-semibold text-near-black">
                    Ticket Sales Commission
                    <span className="ml-2 font-body text-xs font-normal text-sage bg-sage/10 px-1.5 py-0.5 rounded">20%</span>
                  </h2>
                </div>
                <p className="font-body text-xs text-muted-gray ml-9">
                  {fmt(r?.totalTicketSales)} in gross ticket sales ×&nbsp;20% =&nbsp;
                  <span className="font-semibold text-sage">{fmt(r?.ticketCommission)}</span>
                  &nbsp;·&nbsp;{(r?.eventPaymentBreakdown ?? []).reduce((s: number, e: any) => s + e.paymentCount, 0)} completed transactions
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect label="Event"  value={tkEventFilter}  onChange={setTkEventFilter}  options={eventOptions} />
                <FilterSelect label="Vendor" value={tkVendorFilter} onChange={setTkVendorFilter} options={vendorOptions} />
                <button
                  onClick={() => setTicketOpen((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-body text-muted-gray hover:text-near-black transition-colors"
                >
                  {ticketOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {ticketOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
          </div>

          {ticketOpen && (
            <>
              {ticketRows.length === 0 ? (
                <p className="px-6 py-8 text-center font-body text-sm text-muted-gray">No ticket revenue data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-cream/50 border-b border-border-light">
                        {["Event", "Organizer", "Transactions", "Gross Revenue", "Commission (20%)", "% of Total"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-muted-gray uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ticketRows.map((ev: any) => {
                        const event = eventMap.get(ev.eventId);
                        const share = pct(ev.ticketRevenue, r?.totalTicketSales ?? 0);
                        return (
                          <tr key={ev.eventId} className="border-b border-border-light last:border-0 hover:bg-cream/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-body text-sm font-medium text-near-black">
                                {event?.title ?? "Unknown Event"}
                              </p>
                              <p className="font-body text-[10px] text-muted-gray">{event?.city ?? ev.eventId.slice(0, 12) + "…"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-body text-xs text-dark-gray">
                                {userName(event?.organizerId ?? "")}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-sm text-dark-gray">{ev.paymentCount}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-sm font-semibold text-near-black">{fmt(ev.ticketRevenue)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-heading text-sm font-bold text-sage">{fmt(ev.adminCut)}</span>
                            </td>
                            <td className="px-4 py-3 min-w-[100px]">
                              <div className="flex items-center gap-2">
                                <span className="font-body text-xs text-muted-gray w-8 text-right">{share}%</span>
                                <ProgressBar value={share} color="bg-sage" />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-sage/5 border-t-2 border-sage/20">
                        <td className="px-4 py-2.5" colSpan={2}>
                          <span className="font-body text-xs font-semibold text-near-black">
                            {ticketRows.length} event{ticketRows.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-body text-xs font-semibold text-near-black">
                            {ticketRows.reduce((s: number, e: any) => s + e.paymentCount, 0)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-body text-xs font-semibold text-near-black">
                            {fmt(ticketRows.reduce((s: number, e: any) => s + e.ticketRevenue, 0))}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-heading text-sm font-bold text-sage">
                            {fmt(ticketRows.reduce((s: number, e: any) => s + e.adminCut, 0))}
                          </span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION B — Event Organisation Fees
        ══════════════════════════════════════════════════════════════════ */}
        <Card hover={false} padding="none">
          <div className="px-6 py-4 border-b border-border-light">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center">
                    <BarChart3 size={14} className="text-amber" />
                  </div>
                  <h2 className="font-heading text-base font-semibold text-near-black">
                    Event Organisation Fees
                    <span className="ml-2 font-body text-xs font-normal text-amber bg-amber/10 px-1.5 py-0.5 rounded">₹25,000/event</span>
                  </h2>
                </div>
                <p className="font-body text-xs text-muted-gray ml-9">
                  {r?.uniqueEventCount ?? 0} events with budgets × ₹25,000 =&nbsp;
                  <span className="font-semibold text-amber">{fmt(r?.eventFees)}</span>
                  &nbsp;· flat fee per event organised
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect label="Vendor" value={ofVendorFilter} onChange={setOfVendorFilter} options={vendorOptions} />
                <button
                  onClick={() => setOrgFeeOpen((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-body text-muted-gray hover:text-near-black transition-colors"
                >
                  {orgFeeOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {orgFeeOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
          </div>

          {orgFeeOpen && (
            <>
              {orgFeeRows.length === 0 ? (
                <p className="px-6 py-8 text-center font-body text-sm text-muted-gray">No events with budgets yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-cream/50 border-b border-border-light">
                        {["Event", "Organizer / Vendor", "Event Status", "Budget Status", "Platform Fee"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-muted-gray uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orgFeeRows.map((row: any) => {
                        const event = eventMap.get(row.eventId);
                        return (
                          <tr key={row.eventId} className="border-b border-border-light last:border-0 hover:bg-cream/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-body text-sm font-medium text-near-black">
                                {event?.title ?? "Unknown Event"}
                              </p>
                              <p className="font-body text-[10px] text-muted-gray">{event?.city ?? "—"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-body text-xs text-dark-gray">
                                {userName(row.organizerId || event?.organizerId || "")}
                              </p>
                              <p className="font-mono text-[9px] text-muted-gray mt-0.5">
                                {(row.organizerId || event?.organizerId || "").slice(0, 10)}…
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  event?.status === "PUBLISHED" ? "success"
                                  : event?.status === "REGISTRATION_OPEN" ? "info"
                                  : event?.status === "COMPLETED" ? "neutral"
                                  : "warning"
                                }
                              >
                                {event?.status ?? "—"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  row.budgetStatus === "APPROVED" ? "success"
                                  : row.budgetStatus === "PENDING_APPROVAL" ? "warning"
                                  : "neutral"
                                }
                              >
                                {row.budgetStatus?.replace(/_/g, " ") || "—"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-heading text-sm font-bold text-amber">{fmt(row.fee)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber/5 border-t-2 border-amber/20">
                        <td className="px-4 py-2.5" colSpan={4}>
                          <span className="font-body text-xs font-semibold text-near-black">
                            {orgFeeRows.length} event{orgFeeRows.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-heading text-sm font-bold text-amber">
                            {fmt(orgFeeRows.reduce((s: number, r: any) => s + (r.fee ?? 0), 0))}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION C — Venue Booking Commission
        ══════════════════════════════════════════════════════════════════ */}
        <Card hover={false} padding="none">
          <div className="px-6 py-4 border-b border-border-light">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-7 h-7 rounded-lg bg-dusty-blue/10 flex items-center justify-center">
                    <Building2 size={14} className="text-dusty-blue" />
                  </div>
                  <h2 className="font-heading text-base font-semibold text-near-black">
                    Venue Booking Commission
                    <span className="ml-2 font-body text-xs font-normal text-dusty-blue bg-dusty-blue/10 px-1.5 py-0.5 rounded">25%</span>
                  </h2>
                </div>
                <p className="font-body text-xs text-muted-gray ml-9">
                  {fmt(r?.totalVenueBudget)} in venue budget × 25% =&nbsp;
                  <span className="font-semibold text-dusty-blue">{fmt(r?.venueCommission)}</span>
                  &nbsp;· applied on admin-managed venue selections
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect label="Event" value={vbEventFilter} onChange={setVbEventFilter} options={venueEventOptions} />
                <button
                  onClick={() => setVenueOpen((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-body text-muted-gray hover:text-near-black transition-colors"
                >
                  {venueOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {venueOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
          </div>

          {venueOpen && (
            <>
              {venueRows.length === 0 ? (
                <p className="px-6 py-8 text-center font-body text-sm text-muted-gray">No venue budget items found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-cream/50 border-b border-border-light">
                        {["Event", "Organizer / Vendor", "Venue Budget", "Commission (25%)", "Budget Items", "% of Total Venue"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-muted-gray uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {venueRows.map((row: any) => {
                        const event = eventMap.get(row.eventId);
                        const share = pct(row.venueSpend, r?.totalVenueBudget ?? 0);
                        return (
                          <tr key={row.eventId} className="border-b border-border-light last:border-0 hover:bg-cream/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-body text-sm font-medium text-near-black">
                                {event?.title ?? "Unknown Event"}
                              </p>
                              <p className="font-body text-[10px] text-muted-gray">{event?.city ?? "—"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-body text-xs text-dark-gray">
                                {userName(row.organizerId || event?.organizerId || "")}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-sm font-semibold text-near-black">{fmt(row.venueSpend)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-heading text-sm font-bold text-dusty-blue">{fmt(row.venueCommission)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-body text-xs text-dark-gray">{row.itemCount}</span>
                            </td>
                            <td className="px-4 py-3 min-w-[110px]">
                              <div className="flex items-center gap-2">
                                <span className="font-body text-xs text-muted-gray w-8 text-right">{share}%</span>
                                <ProgressBar value={share} color="bg-dusty-blue" />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-dusty-blue/5 border-t-2 border-dusty-blue/20">
                        <td className="px-4 py-2.5" colSpan={2}>
                          <span className="font-body text-xs font-semibold text-near-black">
                            {venueRows.length} event{venueRows.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-body text-xs font-semibold text-near-black">
                            {fmt(venueRows.reduce((s: number, r: any) => s + (r.venueSpend ?? 0), 0))}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-heading text-sm font-bold text-dusty-blue">
                            {fmt(venueRows.reduce((s: number, r: any) => s + (r.venueCommission ?? 0), 0))}
                          </span>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION D — Vendor Revenue Summary
        ══════════════════════════════════════════════════════════════════ */}
        <Card hover={false} padding="none">
          <div className="px-6 py-4 border-b border-border-light">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-burgundy/10 flex items-center justify-center">
                  <Users size={14} className="text-burgundy" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-semibold text-near-black">Vendor Revenue Summary</h2>
                  <p className="font-body text-xs text-muted-gray">Platform earnings attributed to each organizer/vendor</p>
                </div>
              </div>
              <button
                onClick={() => setVendorOpen((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-body text-muted-gray hover:text-near-black transition-colors"
              >
                {vendorOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {vendorOpen ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {vendorOpen && (
            <>
              {(r?.vendorBreakdown ?? []).length === 0 ? (
                <p className="px-6 py-8 text-center font-body text-sm text-muted-gray">No vendor data available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-cream/50 border-b border-border-light">
                        {["Vendor / Organizer", "Events", "Ticket Revenue", "Ticket Cut (20%)", "Org Fees", "Venue Budget", "Venue Cut (25%)", "Total Platform Earn"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-muted-gray uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(r?.vendorBreakdown ?? []).map((v: any) => (
                        <tr key={v.vendorId} className="border-b border-border-light last:border-0 hover:bg-cream/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-body text-sm font-medium text-near-black">{userName(v.vendorId)}</p>
                            <p className="font-mono text-[9px] text-muted-gray mt-0.5">{v.vendorId?.slice(0, 14)}…</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-body text-sm text-dark-gray">{v.eventCount}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-body text-sm text-near-black">{fmt(v.ticketRevenue)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-body text-sm font-semibold text-sage">{fmt(v.ticketCommission)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-body text-sm font-semibold text-amber">{fmt(v.eventFees)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-body text-sm text-near-black">{fmt(v.venueBudget)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-body text-sm font-semibold text-dusty-blue">{fmt(v.venueCommission)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-heading text-sm font-bold text-near-black">{fmt(v.totalAdminCut)}</span>
                            <ProgressBar
                              value={pct(v.totalAdminCut, r?.totalAdminRevenue ?? 0)}
                              color="bg-near-black"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION E — Budget Category Breakdown
        ══════════════════════════════════════════════════════════════════ */}
        {(r?.categoryBreakdown ?? []).length > 0 && (
          <Card hover={false} padding="none">
            <div className="px-6 py-4 border-b border-border-light">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center">
                    <Tag size={14} className="text-amber" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-semibold text-near-black">Budget Spend by Category</h2>
                    <p className="font-body text-xs text-muted-gray">
                      How vendors allocate budgets across {(r?.categoryBreakdown ?? []).reduce((s: number, c: any) => s + c.itemCount, 0)} line items
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCatOpen((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-body text-muted-gray hover:text-near-black transition-colors"
                >
                  {catOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {catOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {catOpen && (
              <div className="px-6 py-5 grid sm:grid-cols-2 gap-x-10 gap-y-4">
                {(r?.categoryBreakdown ?? []).map((c: any) => {
                  const share = pct(c.totalEstimated, catTotal);
                  const color = CAT_COLORS[c.category] ?? "bg-muted-gray";
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                          <span className="font-body text-xs font-medium text-near-black">{c.category}</span>
                          <span className="font-body text-[10px] text-muted-gray">{c.itemCount} item{c.itemCount !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-body text-xs text-muted-gray">{share}%</span>
                          <span className="font-body text-xs font-semibold text-near-black">{fmt(c.totalEstimated)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-border-light rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all duration-700`}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      {c.totalActual > 0 && (
                        <p className="font-body text-[10px] text-muted-gray mt-0.5">
                          Actual spend: {fmt(c.totalActual)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION F — Sponsorships by Event
        ══════════════════════════════════════════════════════════════════ */}
        {r && r.sponsorshipCount > 0 && (
          <Card hover={false} padding="none">
            <div className="px-6 py-4 border-b border-border-light">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center">
                    <Handshake size={14} className="text-amber" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-semibold text-near-black">
                      Sponsorships
                      <span className="ml-2 font-body text-xs font-normal text-muted-gray">{r.sponsorshipCount} total</span>
                    </h2>
                    <p className="font-body text-xs text-muted-gray">
                      {fmt(r.totalSponsorships)} in total sponsorship value across all events
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSponsorOpen((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-body text-muted-gray hover:text-near-black transition-colors"
                >
                  {sponsorOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {sponsorOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {sponsorOpen && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-cream/50 border-b border-border-light">
                      {["Event", "Sponsors", "Total Value", "Companies"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-body text-[10px] font-semibold text-muted-gray uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(r?.sponsorshipByEvent ?? []).map((row: any) => {
                      const event = eventMap.get(row.eventId);
                      return (
                        <tr key={row.eventId} className="border-b border-border-light last:border-0 hover:bg-cream/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-body text-sm font-medium text-near-black">
                              {event?.title ?? "Unknown Event"}
                            </p>
                            <p className="font-body text-[10px] text-muted-gray">{event?.city ?? "—"}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-body text-sm text-dark-gray">{row.sponsorCount}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-heading text-sm font-bold text-amber">{fmt(row.totalAmount)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(row.sponsors ?? []).map((s: any, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 bg-amber/10 text-amber font-body text-[10px] px-2 py-0.5 rounded-full"
                                >
                                  {s.companyName}
                                  <span className="text-amber/70">· {fmt(s.amount)}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ── Platform Totals Strip ───────────────────────────────────────── */}
        <div className="bg-near-black rounded-xl p-5 grid sm:grid-cols-5 gap-4">
          {[
            { label: "Total Events",       value: events.length,                                                                              color: "text-white" },
            { label: "Published",          value: events.filter((e) => e.status === "PUBLISHED").length,                                     color: "text-amber" },
            { label: "Total Registrations",value: events.reduce((s, e) => s + (e.currentRegistrations || 0), 0),                             color: "text-white" },
            { label: "Vendor Partners",    value: (r?.vendorBreakdown ?? []).length,                                                          color: "text-dusty-blue" },
            { label: "Total Admin Revenue",value: fmt(r?.totalAdminRevenue),                                                                  color: "text-sage" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-body text-[10px] text-white/50 mb-1 uppercase tracking-wider">{s.label}</p>
              <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

      </div>
    </PageTransition>
  );
}
