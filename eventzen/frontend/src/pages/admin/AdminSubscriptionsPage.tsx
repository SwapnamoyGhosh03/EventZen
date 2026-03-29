import { useState, useMemo } from "react";
import {
  IndianRupee,
  Users,
  Sparkles,
  Zap,
  Crown,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

/* ─── mock data ─── */
const MOCK_SUBSCRIBERS = [
  { id: "1",  name: "Aarav Mehta",     email: "aarav.mehta@gmail.com",    plan: "ZenPro",     price: 1499, subscribedAt: "2026-01-05", status: "active" },
  { id: "2",  name: "Priya Sharma",    email: "priya.s@outlook.com",      plan: "ZenMax",     price: 2999, subscribedAt: "2026-01-12", status: "active" },
  { id: "3",  name: "Rohan Kapoor",    email: "rohan.k@yahoo.com",        plan: "ZenStarter", price: 499,  subscribedAt: "2026-01-18", status: "active" },
  { id: "4",  name: "Sneha Iyer",      email: "sneha.iyer@gmail.com",     plan: "ZenPro",     price: 1499, subscribedAt: "2026-01-22", status: "active" },
  { id: "5",  name: "Vikram Nair",     email: "v.nair@techcorp.in",       plan: "ZenMax",     price: 2999, subscribedAt: "2026-02-01", status: "active" },
  { id: "6",  name: "Ananya Bose",     email: "ananya.bose@gmail.com",    plan: "ZenStarter", price: 499,  subscribedAt: "2026-02-07", status: "active" },
  { id: "7",  name: "Karan Verma",     email: "karanv@hotmail.com",       plan: "ZenPro",     price: 1499, subscribedAt: "2026-02-14", status: "active" },
  { id: "8",  name: "Divya Reddy",     email: "divya.r@gmail.com",        plan: "ZenStarter", price: 499,  subscribedAt: "2026-02-19", status: "expired" },
  { id: "9",  name: "Nikhil Joshi",    email: "nikhil.j@infosys.com",     plan: "ZenMax",     price: 2999, subscribedAt: "2026-02-25", status: "active" },
  { id: "10", name: "Pooja Gupta",     email: "pooja.gupta@gmail.com",    plan: "ZenPro",     price: 1499, subscribedAt: "2026-03-01", status: "active" },
  { id: "11", name: "Arjun Singh",     email: "arjun.singh@wipro.com",    plan: "ZenPro",     price: 1499, subscribedAt: "2026-03-05", status: "active" },
  { id: "12", name: "Meera Pillai",    email: "meera.p@tcs.com",          plan: "ZenMax",     price: 2999, subscribedAt: "2026-03-10", status: "active" },
  { id: "13", name: "Rahul Choudhary", email: "rahulc@gmail.com",         plan: "ZenStarter", price: 499,  subscribedAt: "2026-03-14", status: "expired" },
  { id: "14", name: "Kavya Nambiar",   email: "kavya.n@gmail.com",        plan: "ZenPro",     price: 1499, subscribedAt: "2026-03-18", status: "active" },
  { id: "15", name: "Ishaan Malhotra", email: "ishaan.m@amazon.in",       plan: "ZenMax",     price: 2999, subscribedAt: "2026-03-22", status: "active" },
];

const PLAN_META: Record<string, { icon: React.ElementType; accentBg: string; accentText: string; badgeBg: string }> = {
  ZenStarter: { icon: Sparkles, accentBg: "bg-sage/10",    accentText: "text-sage",    badgeBg: "bg-sage/15 text-sage" },
  ZenPro:     { icon: Zap,      accentBg: "bg-amber/10",   accentText: "text-amber",   badgeBg: "bg-amber/15 text-amber-dark" },
  ZenMax:     { icon: Crown,    accentBg: "bg-burgundy/10", accentText: "text-burgundy", badgeBg: "bg-burgundy/15 text-burgundy" },
};

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        <Icon size={18} className="text-inherit opacity-80" />
      </div>
      <div>
        <p className="font-body text-xs text-muted-gray uppercase tracking-wider mb-0.5">{label}</p>
        <p className="font-heading text-2xl font-bold text-near-black leading-none">{value}</p>
        {sub && <p className="font-body text-xs text-muted-gray mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ── derived stats ── */
  const active = MOCK_SUBSCRIBERS.filter((s) => s.status === "active");
  const totalMRR = active.reduce((sum, s) => sum + s.price, 0);
  const totalSubs = MOCK_SUBSCRIBERS.length;
  const activeSubs = active.length;

  const planBreakdown = ["ZenStarter", "ZenPro", "ZenMax"].map((plan) => {
    const subs = MOCK_SUBSCRIBERS.filter((s) => s.plan === plan && s.status === "active");
    return { plan, count: subs.length, mrr: subs.reduce((a, s) => a + s.price, 0) };
  });

  /* ── filtered table ── */
  const filtered = useMemo(() => {
    return MOCK_SUBSCRIBERS.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === "all" || s.plan === planFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [search, planFilter, statusFilter]);

  return (
    <PageTransition>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-near-black">
              Subscription Management
            </h1>
            <p className="font-body text-sm text-muted-gray mt-0.5">
              Track membership revenue and subscriber details
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-sm font-body text-muted-gray hover:text-near-black transition-colors px-3 py-1.5 rounded-lg border border-border-light bg-white">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={IndianRupee}
            label="Monthly Revenue"
            value={fmt(totalMRR)}
            sub="from active subscribers"
            accent="bg-amber/10 text-amber"
          />
          <StatCard
            icon={Users}
            label="Total Subscribers"
            value={String(totalSubs)}
            sub={`${activeSubs} active · ${totalSubs - activeSubs} expired`}
            accent="bg-sage/10 text-sage"
          />
          <StatCard
            icon={TrendingUp}
            label="Annual Run Rate"
            value={fmt(totalMRR * 12)}
            sub="projected from current MRR"
            accent="bg-dusty-blue/10 text-dusty-blue"
          />
          <StatCard
            icon={Crown}
            label="Avg. Plan Value"
            value={fmt(activeSubs > 0 ? Math.round(totalMRR / activeSubs) : 0)}
            sub="per active subscriber/mo"
            accent="bg-burgundy/10 text-burgundy"
          />
        </div>

        {/* Plan breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planBreakdown.map(({ plan, count, mrr }) => {
            const meta = PLAN_META[plan];
            const PlanIcon = meta.icon;
            const maxMrr = Math.max(...planBreakdown.map((p) => p.mrr), 1);
            return (
              <Card key={plan} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-lg ${meta.accentBg} flex items-center justify-center`}>
                    <PlanIcon size={16} className={meta.accentText} />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-near-black text-sm">{plan}</p>
                    <p className="font-body text-xs text-muted-gray">{count} active subscribers</p>
                  </div>
                </div>
                <p className="font-heading text-xl font-bold text-near-black mb-2">{fmt(mrr)}<span className="font-body text-xs text-muted-gray font-normal ml-1">/mo</span></p>
                <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      plan === "ZenPro" ? "bg-amber" : plan === "ZenMax" ? "bg-burgundy" : "bg-sage"
                    }`}
                    style={{ width: `${Math.round((mrr / maxMrr) * 100)}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Subscriber table */}
        <Card className="overflow-hidden">
          {/* Table header / filters */}
          <div className="p-4 border-b border-border-light flex flex-wrap gap-3 items-center justify-between">
            <h2 className="font-heading font-semibold text-near-black">
              Subscribers
              <span className="font-body text-sm text-muted-gray font-normal ml-2">
                ({filtered.length} shown)
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-gray" />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs border border-border-light rounded-lg font-body focus:outline-none focus:border-amber w-44"
                />
              </div>
              {/* Plan filter */}
              <div className="flex items-center gap-1">
                <Filter size={11} className="text-muted-gray" />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="text-xs border border-border-light rounded-lg px-2 py-1.5 font-body focus:outline-none focus:border-amber bg-white"
                >
                  <option value="all">All Plans</option>
                  <option value="ZenStarter">ZenStarter</option>
                  <option value="ZenPro">ZenPro</option>
                  <option value="ZenMax">ZenMax</option>
                </select>
              </div>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-border-light rounded-lg px-2 py-1.5 font-body focus:outline-none focus:border-amber bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/60 border-b border-border-light">
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-widest text-muted-gray">Subscriber</th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-widest text-muted-gray">Plan</th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-widest text-muted-gray">Amount</th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-widest text-muted-gray">Subscribed</th>
                  <th className="text-left px-4 py-3 font-accent text-[10px] uppercase tracking-widest text-muted-gray">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const meta = PLAN_META[s.plan];
                  const PlanIcon = meta.icon;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-border-light/60 hover:bg-cream/30 transition-colors ${
                        i % 2 === 0 ? "" : "bg-white/40"
                      }`}
                    >
                      {/* Name + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber/10 text-amber font-accent font-bold text-xs flex items-center justify-center shrink-0">
                            {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-body font-medium text-near-black text-sm">{s.name}</p>
                            <p className="font-body text-xs text-muted-gray">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Plan badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-accent font-semibold ${meta.badgeBg}`}>
                          <PlanIcon size={11} />
                          {s.plan}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <span className="font-heading font-semibold text-near-black">
                          {fmt(s.price)}
                        </span>
                        <span className="font-body text-xs text-muted-gray">/mo</span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-dark-gray">
                          <CalendarDays size={13} className="text-muted-gray" />
                          <span className="font-body text-sm">
                            {new Date(s.subscribedAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {s.status === "active" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-body font-medium text-sage bg-sage/10 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-body font-medium text-muted-gray bg-border-light px-2.5 py-1 rounded-full">
                            <XCircle size={12} />
                            Expired
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center font-body text-muted-gray text-sm">
                      No subscribers match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-3 border-t border-border-light bg-cream/30 flex items-center justify-between">
            <p className="font-body text-xs text-muted-gray">
              Showing {filtered.length} of {MOCK_SUBSCRIBERS.length} subscribers
            </p>
            <p className="font-body text-xs text-muted-gray">
              Active MRR from filtered:{" "}
              <span className="font-semibold text-near-black">
                {fmt(filtered.filter((s) => s.status === "active").reduce((a, s) => a + s.price, 0))}
              </span>
            </p>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
