import { useState } from "react";
import {
  Bell, CheckCheck, Trash2, Download, Loader2, RefreshCw, Filter,
} from "lucide-react";
import { jsPDF } from "jspdf";
import PageTransition from "@/components/layout/PageTransition";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  type Notification,
} from "@/store/api/notificationApi";
import {
  getNotificationIcon,
  getNotificationAccent,
  getNotificationTypeLabel,
  hasPdfAttachment,
} from "@/utils/notificationHelpers";

type Filter = "all" | "unread" | "read";

// ─── PDF generators ───────────────────────────────────────────────────────────

function generateTicketPdf(n: Notification) {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const d = n.data as Record<string, unknown>;

  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, 148, 20, "F");
  doc.setTextColor(212, 168, 67);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EventZen — Ticket", 10, 13);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const rows: [string, string][] = [
    ["Ticket ID", String(d.ticketId ?? d.ticket_id ?? "—")],
    ["Registration ID", String(d.registrationId ?? d.registration_id ?? "—")],
    ["Event ID", String(d.eventId ?? d.event_id ?? "—")],
    ["Ticket Type", String(d.ticketType ?? d.ticket_type ?? "Standard")],
    ["Amount Paid", `₹${d.amountPaid ?? d.amount_paid ?? 0}`],
    ["Date", new Date(String(d.registeredAt ?? d.created_at ?? n.created_at)).toLocaleString("en-IN")],
  ];

  let y = 30;
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 10, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 55, y);
    y += 8;
  });

  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.5);
  doc.line(10, y + 2, 138, y + 2);

  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("This is your official EventZen e-ticket. Present this at the venue.", 10, y);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 10, y + 5);

  doc.save(`EventZen_Ticket_${d.ticketId ?? n.notification_id}.pdf`);
}

function generateReceiptPdf(n: Notification) {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const d = n.data as Record<string, unknown>;

  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, 148, 20, "F");
  doc.setTextColor(212, 168, 67);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EventZen — Payment Receipt", 10, 13);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const rows: [string, string][] = [
    ["Payment ID", String(d.paymentId ?? d.payment_id ?? "—")],
    ["Registration ID", String(d.registrationId ?? d.registration_id ?? "—")],
    ["Event ID", String(d.eventId ?? d.event_id ?? "—")],
    ["Amount", `₹${d.amount ?? d.amountPaid ?? 0} ${d.currency ?? "INR"}`],
    ["Date", new Date(String(d.timestamp ?? d.paidAt ?? n.created_at)).toLocaleString("en-IN")],
    ["Status", "PAID"],
  ];

  let y = 30;
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 10, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 55, y);
    y += 8;
  });

  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.5);
  doc.line(10, y + 2, 138, y + 2);

  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your payment. Keep this receipt for your records.", 10, y);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 10, y + 5);

  doc.save(`EventZen_Receipt_${d.paymentId ?? n.notification_id}.pdf`);
}

function handleDownload(n: Notification) {
  if (n.type === "payment.received") {
    generateReceiptPdf(n);
  } else {
    generateTicketPdf(n);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const statusParam =
    activeFilter === "unread" ? undefined  // unread = everything except READ
    : activeFilter === "read" ? "READ"
    : undefined;

  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery(
    { page: 1, limit: 100, status: statusParam },
    { pollingInterval: 60_000 }
  );
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const allNotifications: Notification[] = data?.data ?? [];

  // Client-side unread filter (the API's status query works per-status value,
  // but we want "everything except READ" for the Unread tab)
  const notifications =
    activeFilter === "unread"
      ? allNotifications.filter((n) => n.status !== "READ")
      : allNotifications;

  const unreadCount = allNotifications.filter((n) => n.status !== "READ").length;

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-IN");
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "read", label: "Read" },
  ];

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
              Notifications
            </h1>
            <p className="font-body text-sm text-muted-gray">
              All updates, alerts, and activity for your account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-body font-medium text-amber border border-amber/30 rounded-lg hover:bg-amber/5 transition-colors"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
            <button
              onClick={() => refetch()}
              className="p-2 text-muted-gray hover:text-amber transition-colors rounded-lg hover:bg-amber/5"
              title="Refresh"
            >
              <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-border-light rounded-xl p-1">
          <Filter size={13} className="text-muted-gray ml-2 flex-shrink-0" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-body font-medium transition-colors ${
                activeFilter === f.key
                  ? "bg-amber text-white shadow-sm"
                  : "text-muted-gray hover:text-near-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="bg-white border border-border-light rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-amber" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell size={32} className="mx-auto text-muted-gray opacity-30 mb-3" />
              <p className="font-heading text-base font-semibold text-near-black mb-1">
                {activeFilter === "unread" ? "No unread notifications" : "No notifications"}
              </p>
              <p className="font-body text-sm text-muted-gray">
                {activeFilter === "unread"
                  ? "You're all caught up!"
                  : "Activity will appear here as you use EventZen."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {notifications.map((n) => {
                const isUnread = n.status !== "READ";
                const Icon = getNotificationIcon(n.type);
                const accent = getNotificationAccent(n.type);
                const showPdf = hasPdfAttachment(n.type);

                return (
                  <div
                    key={n.notification_id}
                    className={`flex gap-4 px-5 py-4 transition-colors group ${
                      isUnread ? "bg-amber/[0.04]" : "hover:bg-cream/40"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5 ${accent}`}>
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-gray">
                              {getNotificationTypeLabel(n.type)}
                            </span>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber flex-shrink-0" />
                            )}
                          </div>
                          <p className={`font-body text-sm mt-0.5 text-near-black ${isUnread ? "font-semibold" : "font-medium"}`}>
                            {n.title}
                          </p>
                          <p className="font-body text-xs text-dark-gray mt-0.5 leading-relaxed">
                            {n.body}
                          </p>
                          <p className="font-body text-[10px] text-muted-gray mt-1.5">
                            {formatTime(n.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {showPdf && (
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          {(n.type === "registration.confirmed" || n.type === "ticket.purchased") && (
                            <button
                              onClick={() => handleDownload(n)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-body font-medium bg-amber/10 text-amber border border-amber/20 rounded-lg hover:bg-amber/20 transition-colors"
                            >
                              <Download size={11} /> Download Ticket PDF
                            </button>
                          )}
                          {n.type === "payment.received" && (
                            <button
                              onClick={() => generateReceiptPdf(n)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-body font-medium bg-sage/10 text-sage border border-sage/20 rounded-lg hover:bg-sage/20 transition-colors"
                            >
                              <Download size={11} /> Download Receipt PDF
                            </button>
                          )}
                          {n.type === "registration.confirmed" && (
                            <button
                              onClick={() => generateReceiptPdf(n)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-body font-medium bg-sage/10 text-sage border border-sage/20 rounded-lg hover:bg-sage/20 transition-colors"
                            >
                              <Download size={11} /> Download Receipt PDF
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right actions */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {isUnread && (
                        <button
                          onClick={() => markAsRead(n.notification_id)}
                          className="p-1.5 rounded-lg text-muted-gray hover:text-amber hover:bg-amber/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Mark as read"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.notification_id)}
                        className="p-1.5 rounded-lg text-muted-gray hover:text-burgundy hover:bg-burgundy/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <p className="text-center font-body text-xs text-muted-gray">
            Showing {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            {activeFilter !== "all" ? ` · ${activeFilter}` : ""}
          </p>
        )}
      </div>
    </PageTransition>
  );
}
