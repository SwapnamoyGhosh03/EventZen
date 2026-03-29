import { useState, useEffect, useRef } from "react";
import {
  IndianRupee, TrendingUp, CreditCard, Receipt, RefreshCw, AlertCircle,
  ChevronDown, Loader2, Plus, Building2, ImageIcon, MessageSquare, Handshake, Upload, X,
  MapPin,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useListEventsQuery } from "@/store/api/eventApi";
import {
  useGetBudgetQuery, useCreateBudgetMutation, useApproveBudgetMutation, useLogExpenseMutation,
  useGetFinancialReportQuery, useAddSponsorshipMutation, useGetSponsorshipsQuery,
  useAutoVenueExpenseMutation, useAddBudgetItemMutation,
} from "@/store/api/paymentApi";
import { useGetEventBookingsQuery, useListVenuesQuery } from "@/store/api/venueApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

const EXPENSE_CATEGORIES = ["VENUE", "CATERING", "AV", "MARKETING", "STAFF", "DECOR", "SECURITY", "LOGISTICS", "OTHER"];

const fmt = (n: number | undefined) =>
  n != null ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹0.00";

const fieldClass =
  "w-full bg-white border-[1.5px] border-warm-tan rounded-md px-3 py-2.5 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all";

type Tab = "overview" | "budget" | "sponsorships";

export default function VendorFinancePage() {
  const currentUserId = useSelector((s: RootState) => s.auth.user?.id || s.auth.user?.userId || "");

  const { data: eventsData } = useListEventsQuery({ size: 100, organizerId: currentUserId }, { skip: !currentUserId });
  const events: any[] = Array.isArray(eventsData?.content)
    ? eventsData.content
    : Array.isArray(eventsData)
    ? eventsData
    : [];

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const eventId = selectedEventId || events[0]?.eventId || events[0]?.id || "";
  const selectedEvent = events.find((e) => (e.eventId || e.id) === eventId) || events[0];

  const { currentData: budget, isLoading: budgetLoading, isError: budgetNotFound, refetch: refetchBudget } = useGetBudgetQuery(eventId, { skip: !eventId });
  const { currentData: report, isLoading: reportLoading, refetch: refetchReport } = useGetFinancialReportQuery(eventId, { skip: !eventId });
  const { currentData: sponsorships, isFetching: sponsorshipsLoading, refetch: refetchSponsorships } = useGetSponsorshipsQuery(eventId, { skip: !eventId });

  const [createBudget, { isLoading: isCreatingBudget }] = useCreateBudgetMutation();
  const [approveBudget] = useApproveBudgetMutation();
  const [addBudgetItem, { isLoading: isAddingItem }] = useAddBudgetItemMutation();
  const [logExpense, { isLoading: isLoggingExpense }] = useLogExpenseMutation();
  const [addSponsorship, { isLoading: isAddingSponsorship }] = useAddSponsorshipMutation();
  const [autoVenueExpense] = useAutoVenueExpenseMutation();

  // Venue bookings for the selected event — used to auto-add venue cost to expenses
  const { data: bookingsData } = useGetEventBookingsQuery(eventId, { skip: !eventId });
  const [venueAutoInfo, setVenueAutoInfo] = useState<{ amount: number; bookingId: string } | null>(null);
  const processedBookings = useRef<Set<string>>(new Set());
  const hasAutoCreated = useRef<Set<string>>(new Set());
  const [budgetInitFailed, setBudgetInitFailed] = useState(false);

  useEffect(() => {
    if (!eventId || !bookingsData) return;
    const bookings: any[] = Array.isArray(bookingsData) ? bookingsData : bookingsData?.bookings ?? [];
    for (const booking of bookings) {
      const bookingId = booking.booking_id || booking.bookingId;
      const totalCost = booking.total_cost ?? booking.totalCost;
      const status = booking.status;
      if (bookingId && totalCost > 0 && status === "CONFIRMED" && !processedBookings.current.has(bookingId)) {
        processedBookings.current.add(bookingId);
        autoVenueExpense({ eventId, bookingId, amount: totalCost, currency: "INR" })
          .unwrap()
          .then((res) => {
            if (!res?.alreadyExists) {
              setVenueAutoInfo({ amount: totalCost, bookingId });
              refetchBudget();
              refetchReport();
            }
          })
          .catch(() => {/* silently ignore — booking may predate budget */});
      }
    }
  }, [eventId, bookingsData]);

  // Venues list — used to auto-fill venue budget from the event's linked venue price
  const { data: venuesData } = useListVenuesQuery();
  const venuesRaw = venuesData?.data ?? venuesData;
  const allVenues: any[] = Array.isArray(venuesRaw) ? venuesRaw : venuesRaw?.venues || [];

  // Auto-fill venue budget amount from the event's venue base_rate (only when no budget exists yet)
  useEffect(() => {
    if (!selectedEvent || budget) return;
    const venueId = selectedEvent.venueId;
    if (!venueId) return;
    const venue = allVenues.find((v: any) => (v._id || v.id) === venueId);
    const baseRate = venue?.pricing?.base_rate;
    if (baseRate && Number(baseRate) > 0) {
      setBudgetForm((f) => ({ ...f, venueAmount: String(baseRate) }));
    }
  }, [eventId, allVenues.length, !!budget]);

  // Auto-create budget the moment no budget exists — no form or approval step needed
  useEffect(() => {
    if (!eventId || !budgetNotFound || hasAutoCreated.current.has(eventId)) return;
    hasAutoCreated.current.add(eventId);
    setBudgetInitFailed(false);
    createBudget({
      eventId,
      data: {
        title: `${selectedEvent?.title || "Event"} Budget`,
        currency: "INR",
        totalEstimated: 0,
        items: [],
      },
    }).unwrap()
      .then(() => refetchBudget())
      .catch(() => {
        hasAutoCreated.current.delete(eventId);
        setBudgetInitFailed(true);
      });
  }, [eventId, budgetNotFound]);

  // Auto-approve if budget is stuck in DRAFT or PENDING_APPROVAL
  useEffect(() => {
    if (budget?.budgetId && budget.status !== "APPROVED") {
      approveBudget(budget.budgetId).catch(() => {});
    }
  }, [budget?.budgetId, budget?.status]);

  // Budget form state
  const [budgetForm, setBudgetForm] = useState({ venueAmount: "", marketingAmount: "", staffAmount: "" });
  const [budgetError, setBudgetError] = useState("");

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({ category: "MARKETING", amount: "", description: "" });
  const [expenseFile, setExpenseFile] = useState<File | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState(false);
  const [expenseError, setExpenseError] = useState("");

  // Add budget item form state
  const [addItemForm, setAddItemForm] = useState({ category: "OTHER", description: "", estimatedAmount: "", actualAmount: "" });
  const [addItemError, setAddItemError] = useState("");
  const [addItemSuccess, setAddItemSuccess] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  // Sponsorship form state
  const [sponsorForm, setSponsorForm] = useState({ companyName: "", logoUrl: "", message: "", amount: "" });
  const [logoPreview, setLogoPreview] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [sponsorSuccess, setSponsorSuccess] = useState(false);
  const [sponsorError, setSponsorError] = useState("");

  // Reset all form and notification state when the selected event changes
  useEffect(() => {
    setBudgetForm({ venueAmount: "", marketingAmount: "", staffAmount: "" });
    setBudgetError("");
    setExpenseForm({ category: "MARKETING", amount: "", description: "" });
    setExpenseFile(null);
    setExpenseSuccess(false);
    setExpenseError("");
    setAddItemForm({ category: "OTHER", description: "", estimatedAmount: "", actualAmount: "" });
    setAddItemError("");
    setAddItemSuccess(false);
    setShowAddItem(false);
    setSponsorForm({ companyName: "", logoUrl: "", message: "", amount: "" });
    setLogoPreview("");
    setSponsorSuccess(false);
    setSponsorError("");
    setVenueAutoInfo(null);
    setBudgetInitFailed(false);
  }, [eventId]);

  const handleCreateBudget = async () => {
    if (!eventId) return;
    setBudgetError("");
    const total =
      (Number(budgetForm.venueAmount) || 0) +
      (Number(budgetForm.marketingAmount) || 0) +
      (Number(budgetForm.staffAmount) || 0);
    if (total === 0) { setBudgetError("Please enter at least one budget amount."); return; }
    try {
      await createBudget({
        eventId,
        data: {
          title: `${selectedEvent?.title || "Event"} Budget`,
          currency: "INR",
          totalEstimated: total,
          items: [
            budgetForm.venueAmount && { category: "VENUE", description: "Venue costs", estimatedAmount: Number(budgetForm.venueAmount), actualAmount: 0 },
            budgetForm.marketingAmount && { category: "MARKETING", description: "Marketing costs", estimatedAmount: Number(budgetForm.marketingAmount), actualAmount: 0 },
            budgetForm.staffAmount && { category: "STAFF", description: "Staffing costs", estimatedAmount: Number(budgetForm.staffAmount), actualAmount: 0 },
          ].filter(Boolean),
        },
      }).unwrap();
      setBudgetForm({ venueAmount: "", marketingAmount: "", staffAmount: "" });
      refetchBudget();
    } catch (err: any) {
      setBudgetError(err?.data?.error?.message || err?.data?.message || "Failed to create budget");
    }
  };

  const handleAddBudgetItem = async () => {
    if (!budget?.budgetId || !addItemForm.description || !addItemForm.estimatedAmount) {
      setAddItemError("Description and estimated amount are required."); return;
    }
    setAddItemError("");
    setAddItemSuccess(false);
    try {
      await addBudgetItem({
        budgetId: budget.budgetId,
        data: {
          category: addItemForm.category,
          description: addItemForm.description,
          estimatedAmount: Number(addItemForm.estimatedAmount),
          actualAmount: Number(addItemForm.actualAmount) || 0,
        },
      }).unwrap();
      setAddItemForm({ category: "OTHER", description: "", estimatedAmount: "", actualAmount: "" });
      setAddItemSuccess(true);
      setShowAddItem(false);
      refetchBudget();
      setTimeout(() => setAddItemSuccess(false), 3000);
    } catch (err: any) {
      setAddItemError(err?.data?.error?.message || err?.data?.message || "Failed to add budget item");
    }
  };

  const handleLogExpense = async () => {
    if (!eventId || !expenseForm.amount || !expenseForm.description) {
      setExpenseError("Amount and description are required."); return;
    }
    setExpenseError("");
    setExpenseSuccess(false);
    try {
      await logExpense({
        eventId,
        category: expenseForm.category,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        currency: "INR",
        receiptUrl: expenseFile ? `bill:${expenseFile.name}` : undefined,
      }).unwrap();
      setExpenseForm({ category: "MARKETING", amount: "", description: "" });
      setExpenseFile(null);
      setExpenseSuccess(true);
      refetchReport();
      setTimeout(() => setExpenseSuccess(false), 3000);
    } catch (err: any) {
      setExpenseError(err?.data?.error?.message || err?.data?.message || "Failed to log expense");
    }
  };

  const handleAddSponsorship = async () => {
    if (!eventId || !sponsorForm.companyName || !sponsorForm.amount) {
      setSponsorError("Company name and amount are required."); return;
    }
    setSponsorError("");
    setSponsorSuccess(false);
    try {
      await addSponsorship({
        eventId,
        data: {
          companyName: sponsorForm.companyName,
          logoUrl: sponsorForm.logoUrl || undefined,
          message: sponsorForm.message || undefined,
          amount: Number(sponsorForm.amount),
        },
      }).unwrap();
      setSponsorForm({ companyName: "", logoUrl: "", message: "", amount: "" });
      setLogoPreview("");
      setSponsorSuccess(true);
      refetchSponsorships();
      setTimeout(() => setSponsorSuccess(false), 3000);
    } catch (err: any) {
      setSponsorError(err?.data?.error?.message || err?.data?.message || "Failed to add sponsorship");
    }
  };

  const approvedBudget = budget?.totalApproved ?? budget?.totalEstimated ?? 0;
  const actualSpend = budget?.totalActual ?? report?.totalExpenses ?? 0;
  const revenue = report?.totalPaymentsReceived ?? 0;
  const sponsorshipTotal = (sponsorships || []).reduce((s: number, sp: any) => s + (sp.amount || 0), 0);
  const netProfit = revenue + sponsorshipTotal - actualSpend;
  const expenseHistory: any[] = Array.isArray(report?.recentExpenses) ? report.recentExpenses : [];
  const submittedExpenseCount = expenseHistory.filter((e) => e?.status === "SUBMITTED").length;
  const approvedExpenseCount = expenseHistory.filter((e) => e?.status === "APPROVED").length;
  const latestExpenseAt = expenseHistory[0]?.createdAt ? new Date(expenseHistory[0].createdAt) : null;

  const alerts: string[] = [];
  if (report?.budgetUtilizationPercent > 85) alerts.push(`Budget utilization at ${report.budgetUtilizationPercent?.toFixed(0)}% — nearing limit.`);
  if (budget?.totalActual > budget?.totalApproved && budget?.totalApproved > 0) alerts.push("Actual spend exceeds approved budget.");

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: IndianRupee },
    { key: "budget", label: "Budget & Expenses", icon: Receipt },
    { key: "sponsorships", label: "Sponsorships", icon: Handshake },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header + Event Selector */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-body text-xs text-amber uppercase tracking-widest mb-1">VENDOR PORTAL</p>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
              Vendor Finance Dashboard
            </h1>
            <p className="font-body text-dark-gray text-sm">
              Track revenue, expenses, and budget health across your managed events.
            </p>
          </div>
          <div className="relative flex-shrink-0 min-w-[220px]">
            <select
              value={selectedEventId || eventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full appearance-none bg-white border border-border-light rounded-lg px-4 py-2.5 pr-9 font-body text-sm text-near-black focus:outline-none focus:border-amber cursor-pointer"
            >
              {events.map((e) => (
                <option key={e.eventId || e.id} value={e.eventId || e.id}>{e.title}</option>
              ))}
              {events.length === 0 && <option value="">No events</option>}
            </select>
            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-gray pointer-events-none" />
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Approved Budget", value: fmt(approvedBudget), icon: CreditCard, color: "bg-dusty-blue/10 text-dusty-blue" },
            { label: "Actual Spend", value: fmt(actualSpend), icon: Receipt, color: "bg-amber/10 text-amber" },
            { label: "Ticket Revenue", value: fmt(revenue), icon: TrendingUp, color: "bg-sage/10 text-sage" },
            { label: "Net Profit", value: fmt(netProfit), icon: IndianRupee, color: netProfit >= 0 ? "bg-sage/10 text-sage" : "bg-burgundy/10 text-burgundy" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-border-light rounded-lg p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <p className="font-body text-xs text-muted-gray">{s.label}</p>
              <p className="font-heading text-xl font-bold text-near-black mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white border border-border-light rounded-xl overflow-hidden">
          <div className="flex border-b border-border-light bg-cream/30">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 font-body text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-b-2 border-amber text-amber bg-white"
                    : "text-muted-gray hover:text-near-black"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
            <div className="flex-1 flex justify-end items-center px-4">
              <button
                className="flex items-center gap-1.5 text-xs font-body text-muted-gray hover:text-amber transition-colors"
                onClick={() => { refetchBudget(); refetchReport(); refetchSponsorships(); }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div className="p-6">
              {eventId && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-heading text-base font-semibold text-near-black">
                        {selectedEvent?.title || "Selected Event"}
                      </h2>
                      <p className="font-body text-xs text-muted-gray">Budget tracking and expense control for your event operations.</p>
                    </div>
                    {budget && (
                      <Badge variant={budget.status === "APPROVED" ? "success" : budget.status === "PENDING_APPROVAL" ? "warning" : "neutral"}>
                        {budget.status?.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>

                  {budgetLoading || reportLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-amber" />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Budget utilization bar */}
                      {approvedBudget > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-body text-muted-gray">
                            <span>Budget Utilization</span>
                            <span>{((actualSpend / approvedBudget) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-2.5 bg-cream rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                actualSpend / approvedBudget > 0.9 ? "bg-burgundy" :
                                actualSpend / approvedBudget > 0.7 ? "bg-amber" : "bg-sage"
                              }`}
                              style={{ width: `${Math.min((actualSpend / approvedBudget) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Category breakdown */}
                      {budget?.budgetItems?.length > 0 && (
                        <div>
                          <p className="font-body text-xs font-semibold text-near-black mb-3">Category Breakdown</p>
                          <div className="space-y-2">
                            {budget.budgetItems.map((item: any) => (
                              <div key={item.itemId} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                                <div>
                                  <p className="font-body text-sm font-medium text-near-black">{item.category}</p>
                                  <p className="font-body text-[10px] text-muted-gray">{item.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-body text-sm font-semibold text-near-black">{fmt(item.estimatedAmount)}</p>
                                  {item.variance !== 0 && (
                                    <p className={`font-body text-[10px] ${item.variance > 0 ? "text-sage" : "text-burgundy"}`}>
                                      {item.variance > 0 ? "+" : ""}₹{Math.abs(item.variance).toLocaleString("en-IN")} variance
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expense by category from report */}
                      {report?.expensesByCategory?.length > 0 && (
                        <div>
                          <p className="font-body text-xs font-semibold text-near-black mb-3">Expenses by Category</p>
                          <div className="space-y-2">
                            {report.expensesByCategory.map((cat: any) => (
                              <div key={cat.category} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                                <div>
                                  <p className="font-body text-sm font-medium text-near-black">{cat.category}</p>
                                  <p className="font-body text-[10px] text-muted-gray">Estimated: {fmt(cat.estimatedAmount)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-heading text-sm font-bold text-near-black">{fmt(cat.actualAmount)}</p>
                                  {cat.variance !== 0 && (
                                    <p className={`font-body text-[10px] ${cat.variance > 0 ? "text-sage" : "text-burgundy"}`}>
                                      {cat.variance > 0 ? "Under by" : "Over by"} ₹{Math.abs(cat.variance).toLocaleString("en-IN")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sponsorship summary */}
                      {(sponsorships || []).length > 0 && (
                        <div className="p-4 bg-amber/5 border border-amber/20 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Handshake size={16} className="text-amber" />
                              <p className="font-body text-sm font-semibold text-near-black">
                                {(sponsorships || []).length} Sponsor{(sponsorships || []).length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <p className="font-heading text-sm font-bold text-amber">{fmt(sponsorshipTotal)}</p>
                          </div>
                          <p className="font-body text-xs text-muted-gray mt-1">Total sponsorship income for this event.</p>
                        </div>
                      )}

                      {!budget && !report && (
                        <div className="text-center py-8">
                          <Receipt size={32} className="mx-auto text-muted-gray mb-3 opacity-40" />
                          <p className="font-body text-sm text-muted-gray">No financial data yet. Create a budget to get started.</p>
                          <button
                            onClick={() => setActiveTab("budget")}
                            className="mt-3 font-body text-sm text-amber hover:underline"
                          >
                            Go to Budget & Expenses →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Alerts */}
              <div className="mt-6 pt-6 border-t border-border-light">
                <h3 className="font-heading text-sm font-semibold text-near-black mb-3 flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber" /> Alerts
                </h3>
                {alerts.length === 0 ? (
                  <p className="font-body text-sm text-muted-gray">No active finance alerts.</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 bg-amber/5 border border-amber/20 rounded-lg px-3 py-2.5">
                        <AlertCircle size={14} className="text-amber flex-shrink-0 mt-0.5" />
                        <p className="font-body text-xs text-dark-gray">{a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Budget & Expenses */}
          {activeTab === "budget" && (
            <div className="p-6">
              {budgetLoading || reportLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-amber" />
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Budget side */}
                    <div>
                    {/* Auto-venue expense banner */}
                    {venueAutoInfo && (
                      <div className="flex items-start gap-3 bg-sage/10 border border-sage/30 rounded-xl px-4 py-3 mb-4">
                        <MapPin size={16} className="text-sage flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-body text-sm font-semibold text-near-black">Venue cost auto-added</p>
                          <p className="font-body text-xs text-dark-gray">
                            ₹{venueAutoInfo.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} from your EventZen venue booking was automatically recorded as a VENUE expense.
                          </p>
                        </div>
                        <button onClick={() => setVenueAutoInfo(null)} className="text-muted-gray hover:text-near-black transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {budget?.budgetId ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading text-sm font-semibold text-near-black">Budget Overview</h3>
                          <Badge variant={budget.status === "APPROVED" ? "success" : budget.status === "PENDING_APPROVAL" ? "warning" : "neutral"}>
                            {budget.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "Estimated", value: fmt(budget.totalEstimated) },
                            { label: "Approved", value: fmt(budget.totalApproved) },
                            { label: "Spent", value: fmt(budget.totalActual) },
                          ].map((s) => (
                            <div key={s.label} className="bg-cream/50 rounded-lg p-3 text-center border border-border-light">
                              <p className="font-body text-[10px] text-muted-gray uppercase tracking-wider">{s.label}</p>
                              <p className="font-heading text-sm font-bold text-near-black mt-1">{s.value}</p>
                            </div>
                          ))}
                        </div>
                        {approvedBudget > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-body text-muted-gray">
                              <span>Utilization</span>
                              <span>{((actualSpend / approvedBudget) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-cream rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  actualSpend / approvedBudget > 0.9 ? "bg-burgundy" :
                                  actualSpend / approvedBudget > 0.7 ? "bg-amber" : "bg-sage"
                                }`}
                                style={{ width: `${Math.min((actualSpend / approvedBudget) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {budget.budgetItems?.length > 0 && (
                          <div className="space-y-2">
                            <p className="font-body text-xs font-medium text-near-black">Items</p>
                            {budget.budgetItems.map((item: any) => (
                              <div key={item.itemId} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                                <div>
                                  <p className="font-body text-xs font-medium text-near-black">{item.category}</p>
                                  <p className="font-body text-[10px] text-muted-gray">{item.description}</p>
                                </div>
                                <p className="font-body text-xs font-semibold text-near-black">{fmt(item.estimatedAmount)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {addItemSuccess && (
                          <p className="font-body text-xs text-sage bg-sage/10 border border-sage/20 rounded-lg px-3 py-2">
                            Budget item added successfully.
                          </p>
                        )}
                        {!showAddItem ? (
                          <button
                            onClick={() => setShowAddItem(true)}
                            className="flex items-center gap-1.5 text-xs font-body text-amber hover:underline"
                          >
                            <Plus size={13} /> Add Budget Item
                          </button>
                        ) : (
                          <div className="space-y-2.5 pt-2 border-t border-border-light">
                            <p className="font-body text-xs font-medium text-near-black">New Budget Item</p>
                            <select
                              value={addItemForm.category}
                              onChange={(e) => setAddItemForm((f) => ({ ...f, category: e.target.value }))}
                              className={fieldClass}
                            >
                              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input
                              value={addItemForm.description}
                              onChange={(e) => setAddItemForm((f) => ({ ...f, description: e.target.value }))}
                              placeholder="Description *"
                              className={fieldClass}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                value={addItemForm.estimatedAmount}
                                onChange={(e) => setAddItemForm((f) => ({ ...f, estimatedAmount: e.target.value }))}
                                placeholder="Estimated amount *"
                                className={fieldClass}
                              />
                              <input
                                type="number"
                                value={addItemForm.actualAmount}
                                onChange={(e) => setAddItemForm((f) => ({ ...f, actualAmount: e.target.value }))}
                                placeholder="Actual amount"
                                className={fieldClass}
                              />
                            </div>
                            {addItemError && <p className="text-xs text-burgundy font-body">{addItemError}</p>}
                            <div className="flex gap-2">
                              <Button className="flex-1" onClick={handleAddBudgetItem} isLoading={isAddingItem}>
                                Add Item
                              </Button>
                              <button
                                onClick={() => { setShowAddItem(false); setAddItemError(""); }}
                                className="px-4 py-2 text-xs font-body text-muted-gray border border-border-light rounded-md hover:text-near-black transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : budgetInitFailed ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <p className="font-body text-sm text-burgundy">Failed to initialize budget.</p>
                        <Button
                          size="sm"
                          isLoading={isCreatingBudget}
                          onClick={() => {
                            setBudgetInitFailed(false);
                            createBudget({
                              eventId,
                              data: { title: `${selectedEvent?.title || "Event"} Budget`, currency: "INR", totalEstimated: 0, items: [] },
                            }).unwrap().then(() => refetchBudget()).catch(() => setBudgetInitFailed(true));
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-12 gap-2">
                        <Loader2 size={18} className="animate-spin text-amber" />
                        <p className="font-body text-sm text-muted-gray">Initializing budget…</p>
                      </div>
                    )}
                    </div>

                    {/* Expense side */}
                    <div>
                    <h3 className="font-heading text-sm font-semibold text-near-black mb-4 flex items-center gap-2">
                      <Receipt size={15} className="text-amber" /> Log Expense
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-near-black mb-1 font-body">
                          Expense Category <span className="text-burgundy">*</span>
                        </label>
                        <select value={expenseForm.category} onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))} className={fieldClass}>
                          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-near-black mb-1 font-body">
                          Amount <span className="text-burgundy">*</span>
                        </label>
                        <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Enter expense amount" className={fieldClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-near-black mb-1 font-body">
                          Description <span className="text-burgundy">*</span>
                        </label>
                        <input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} placeholder="Enter expense description" className={fieldClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-near-black mb-1 font-body">Bill / Receipt</label>
                        {expenseFile ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-amber/5 border border-amber/30 rounded-lg">
                            {expenseFile.type.startsWith("image/") ? (
                              <ImageIcon size={15} className="text-amber flex-shrink-0" />
                            ) : (
                              <Receipt size={15} className="text-amber flex-shrink-0" />
                            )}
                            <span className="font-body text-xs text-near-black truncate flex-1">{expenseFile.name}</span>
                            <button
                              type="button"
                              onClick={() => setExpenseFile(null)}
                              className="text-muted-gray hover:text-burgundy transition-colors flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-border-light rounded-lg cursor-pointer hover:border-amber hover:bg-amber/5 transition-all group">
                            <Upload size={15} className="text-muted-gray group-hover:text-amber transition-colors" />
                            <span className="font-body text-xs text-muted-gray group-hover:text-amber transition-colors">
                              Upload bill or receipt
                            </span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setExpenseFile(file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                        <p className="font-body text-[10px] text-muted-gray mt-1">Accepts images or PDF</p>
                      </div>
                      {expenseError && <p className="text-xs text-burgundy font-body">{expenseError}</p>}
                      {expenseSuccess && (
                        <p className="text-xs text-sage font-body bg-sage/10 rounded-lg px-3 py-2 border border-sage/20">
                          Expense logged successfully.
                        </p>
                      )}
                      <Button className="w-full" onClick={handleLogExpense} isLoading={isLoggingExpense}>
                        Save Expense
                      </Button>
                    </div>
                    </div>
                  </div>

                  <div className="border-t border-border-light pt-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <h3 className="font-heading text-sm font-semibold text-near-black">Expense History & Audit Trail</h3>
                        <p className="font-body text-xs text-muted-gray mt-1">
                          Complete log of previously recorded expenses for this event, including who logged each entry and current approval state.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-cream/60 border border-border-light rounded-lg px-3 py-2 min-w-[110px]">
                          <p className="font-body text-[10px] text-muted-gray uppercase">Entries</p>
                          <p className="font-heading text-sm font-bold text-near-black">{expenseHistory.length}</p>
                        </div>
                        <div className="bg-cream/60 border border-border-light rounded-lg px-3 py-2 min-w-[110px]">
                          <p className="font-body text-[10px] text-muted-gray uppercase">Submitted</p>
                          <p className="font-heading text-sm font-bold text-amber">{submittedExpenseCount}</p>
                        </div>
                        <div className="bg-cream/60 border border-border-light rounded-lg px-3 py-2 min-w-[110px]">
                          <p className="font-body text-[10px] text-muted-gray uppercase">Approved</p>
                          <p className="font-heading text-sm font-bold text-sage">{approvedExpenseCount}</p>
                        </div>
                        <div className="bg-cream/60 border border-border-light rounded-lg px-3 py-2 min-w-[140px]">
                          <p className="font-body text-[10px] text-muted-gray uppercase">Last Entry</p>
                          <p className="font-heading text-xs font-bold text-near-black">
                            {latestExpenseAt ? latestExpenseAt.toLocaleString("en-IN") : "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {expenseHistory.length === 0 ? (
                      <div className="rounded-xl border border-border-light bg-cream/30 px-4 py-6 text-center">
                        <p className="font-body text-sm text-muted-gray">No expenses logged yet for this event.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-border-light rounded-xl">
                        <table className="min-w-full text-sm">
                          <thead className="bg-cream/50 border-b border-border-light">
                            <tr>
                              <th className="text-left px-3 py-2 font-body text-[11px] uppercase tracking-wide text-muted-gray">Date</th>
                              <th className="text-left px-3 py-2 font-body text-[11px] uppercase tracking-wide text-muted-gray">Category</th>
                              <th className="text-left px-3 py-2 font-body text-[11px] uppercase tracking-wide text-muted-gray">Description</th>
                              <th className="text-right px-3 py-2 font-body text-[11px] uppercase tracking-wide text-muted-gray">Amount</th>
                              <th className="text-left px-3 py-2 font-body text-[11px] uppercase tracking-wide text-muted-gray">Status</th>
                              <th className="text-left px-3 py-2 font-body text-[11px] uppercase tracking-wide text-muted-gray">Logged By</th>
                              <th className="text-left px-3 py-2 font-body text-[11px] uppercase tracking-wide text-muted-gray">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-light bg-white">
                            {expenseHistory.map((exp) => (
                              <tr key={exp.expenseId}>
                                <td className="px-3 py-2 font-body text-xs text-near-black whitespace-nowrap">
                                  {exp.createdAt ? new Date(exp.createdAt).toLocaleString("en-IN") : "-"}
                                </td>
                                <td className="px-3 py-2 font-body text-xs text-near-black whitespace-nowrap">{exp.category || "-"}</td>
                                <td className="px-3 py-2 font-body text-xs text-dark-gray min-w-[220px]">{exp.description || "-"}</td>
                                <td className="px-3 py-2 font-body text-xs text-near-black text-right whitespace-nowrap">
                                  {fmt(Number(exp.amount) || 0)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <Badge
                                    variant={
                                      exp.status === "APPROVED"
                                        ? "success"
                                        : exp.status === "REJECTED"
                                        ? "danger"
                                        : "warning"
                                    }
                                  >
                                    {exp.status || "SUBMITTED"}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 font-body text-xs text-muted-gray whitespace-nowrap">{exp.submittedBy || "-"}</td>
                                <td className="px-3 py-2 font-body text-xs whitespace-nowrap">
                                  {exp.receiptUrl ? (
                                    <a
                                      href={exp.receiptUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-amber hover:underline"
                                    >
                                      View
                                    </a>
                                  ) : (
                                    <span className="text-muted-gray">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Sponsorships */}
          {activeTab === "sponsorships" && (
            <div className="p-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Add sponsor form */}
                <div>
                  <h3 className="font-heading text-sm font-semibold text-near-black mb-4 flex items-center gap-2">
                    <Plus size={15} className="text-amber" /> Add Sponsor
                  </h3>
                  <p className="font-body text-xs text-muted-gray mb-4">
                    Sponsors contribute funding and receive logo placement on the event page. Their company name and logo will appear in the Sponsors tab of your event listing.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-near-black mb-1 font-body">
                        Company Name <span className="text-burgundy">*</span>
                      </label>
                      <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray" />
                        <input
                          value={sponsorForm.companyName}
                          onChange={(e) => setSponsorForm((f) => ({ ...f, companyName: e.target.value }))}
                          placeholder="e.g. Acme Corporation"
                          className={fieldClass + " pl-9"}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-near-black mb-1 font-body">
                        Sponsorship Amount (₹) <span className="text-burgundy">*</span>
                      </label>
                      <div className="relative">
                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray" />
                        <input
                          type="number"
                          value={sponsorForm.amount}
                          onChange={(e) => setSponsorForm((f) => ({ ...f, amount: e.target.value }))}
                          placeholder="Enter sponsorship amount"
                          className={fieldClass + " pl-9"}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-near-black mb-1 font-body">
                        Sponsor Logo
                      </label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUrl = reader.result as string;
                            setSponsorForm((f) => ({ ...f, logoUrl: dataUrl }));
                            setLogoPreview(dataUrl);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      {logoPreview ? (
                        <div className="flex items-center gap-3 p-3 bg-white border-[1.5px] border-warm-tan rounded-md">
                          <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded-lg object-contain border border-border-light bg-cream flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-xs text-near-black truncate">Logo uploaded</p>
                            <p className="font-body text-[10px] text-muted-gray mt-0.5">Click below to change</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSponsorForm((f) => ({ ...f, logoUrl: "" })); setLogoPreview(""); if (logoInputRef.current) logoInputRef.current.value = ""; }}
                            className="p-1 rounded-full hover:bg-burgundy/10 text-muted-gray hover:text-burgundy transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 border-[1.5px] border-dashed border-warm-tan rounded-md py-3 px-4 text-muted-gray hover:border-amber hover:text-amber transition-all bg-white"
                        >
                          <Upload size={14} />
                          <span className="font-body text-xs">Click to upload logo image</span>
                        </button>
                      )}
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="mt-1 w-full text-center font-body text-[10px] text-muted-gray hover:text-amber transition-colors"
                        >
                          Change logo
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-near-black mb-1 font-body">
                        Sponsor Message
                      </label>
                      <div className="relative">
                        <MessageSquare size={14} className="absolute left-3 top-3 text-muted-gray" />
                        <textarea
                          value={sponsorForm.message}
                          onChange={(e) => setSponsorForm((f) => ({ ...f, message: e.target.value }))}
                          placeholder="A short message from the sponsor (shown on event page)"
                          rows={3}
                          className={fieldClass + " pl-9 resize-none"}
                        />
                      </div>
                    </div>
                    {sponsorError && <p className="text-xs text-burgundy font-body">{sponsorError}</p>}
                    {sponsorSuccess && (
                      <p className="text-xs text-sage font-body bg-sage/10 rounded-lg px-3 py-2 border border-sage/20">
                        Sponsor added successfully. They'll appear on the event page.
                      </p>
                    )}
                    <Button className="w-full" onClick={handleAddSponsorship} isLoading={isAddingSponsorship}>
                      <Handshake size={15} className="mr-2" /> Add Sponsor
                    </Button>
                  </div>
                </div>

                {/* Sponsor list */}
                <div>
                  <h3 className="font-heading text-sm font-semibold text-near-black mb-4">
                    Current Sponsors
                    {(sponsorships || []).length > 0 && (
                      <span className="ml-2 font-body text-xs text-muted-gray font-normal">
                        ({(sponsorships || []).length} sponsor{(sponsorships || []).length !== 1 ? "s" : ""} · {fmt(sponsorshipTotal)} total)
                      </span>
                    )}
                  </h3>

                  {sponsorshipsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-amber" />
                    </div>
                  ) : (sponsorships || []).length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-border-light rounded-xl">
                      <Handshake size={28} className="mx-auto text-muted-gray mb-2 opacity-40" />
                      <p className="font-body text-sm text-muted-gray">No sponsors added yet.</p>
                      <p className="font-body text-xs text-muted-gray mt-1">Add your first sponsor using the form.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(sponsorships || []).map((sp: any) => (
                        <div key={sp.sponsorshipId} className="flex items-start gap-3 p-4 bg-white border border-border-light rounded-xl hover:border-amber/30 transition-all">
                          {sp.logoUrl ? (
                            <img src={sp.logoUrl} alt={sp.companyName} className="w-12 h-12 rounded-lg object-contain border border-border-light bg-cream flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-amber/10 flex items-center justify-center flex-shrink-0 border border-amber/20">
                              <Building2 size={20} className="text-amber" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-heading text-sm font-semibold text-near-black">{sp.companyName}</p>
                              <p className="font-heading text-sm font-bold text-amber flex-shrink-0">{fmt(sp.amount)}</p>
                            </div>
                            {sp.message && (
                              <p className="font-body text-xs text-muted-gray mt-1 leading-relaxed line-clamp-2">{sp.message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-3 bg-sage/5 border border-sage/20 rounded-lg">
                        <p className="font-body text-xs text-sage font-semibold">Total Sponsorship Income: {fmt(sponsorshipTotal)}</p>
                        <p className="font-body text-[10px] text-muted-gray mt-0.5">Sponsor logos and messages are shown publicly on the event page.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
