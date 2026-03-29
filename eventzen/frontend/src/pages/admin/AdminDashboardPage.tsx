import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Calendar, Ticket, ShieldCheck, Store, AlertCircle,
  Building2, ChevronRight, Search, RefreshCw, IndianRupee,
  UserCheck, Save, TriangleAlert, Star,
} from "lucide-react";
import { useGetReviewSummaryQuery } from "@/store/api/reviewApi";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  useListUsersQuery, useGetAdminRequestsQuery, useApproveRequestMutation,
  useRejectRequestMutation, useAssignRoleMutation, useDeactivateUserMutation,
  useReactivateUserMutation, useGdprDeleteMutation,
} from "@/store/api/authApi";
import { useListEventsQuery } from "@/store/api/eventApi";

const EMOJIS_ADMIN = ["", "😞", "😕", "😐", "😊", "🤩"];

function AdminEventRatingCard({ event }: { event: any }) {
  const eventId = event.eventId || event.id;
  const { data: summary } = useGetReviewSummaryQuery(eventId, { skip: !eventId });

  const avg = summary?.averageRating ?? summary?.averageEventRating ?? summary?.average;
  const vendorAvg = summary?.averageVendorRating ?? null;
  const count = summary?.count ?? summary?.totalReviews ?? summary?.total ?? 0;

  const score = avg ? parseFloat(avg).toFixed(1) : null;
  const vendorScore = vendorAvg ? parseFloat(vendorAvg).toFixed(1) : null;
  const emoji = score ? (EMOJIS_ADMIN[Math.round(parseFloat(score))] || "⭐") : "—";

  return (
    <div className="bg-white border border-border-light rounded-xl p-4 space-y-3">
      <div>
        <p className="font-body text-sm font-medium text-near-black line-clamp-1">{event.title}</p>
        <p className="font-body text-xs text-muted-gray">{event.city} · {count} review{count !== 1 ? "s" : ""}</p>
      </div>
      {score ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center bg-amber/5 rounded-lg py-2">
            <p className="font-accent text-[9px] uppercase tracking-wider text-muted-gray mb-1">Event</p>
            <p className="text-xl">{emoji}</p>
            <p className="font-heading text-base font-bold text-amber">{score}</p>
          </div>
          <div className="text-center bg-sage/5 rounded-lg py-2">
            <p className="font-accent text-[9px] uppercase tracking-wider text-muted-gray mb-1">Vendor</p>
            <p className="text-xl">{vendorScore ? EMOJIS_ADMIN[Math.round(parseFloat(vendorScore))] : "—"}</p>
            <p className="font-heading text-base font-bold text-sage">{vendorScore ?? "—"}</p>
          </div>
        </div>
      ) : (
        <p className="font-body text-xs text-muted-gray text-center py-2">No reviews yet</p>
      )}
    </div>
  );
}

const ROLES = ["ADMIN", "VENDOR", "CUSTOMER"];
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-burgundy/10 text-burgundy border-burgundy/30",
  VENDOR: "bg-amber/10 text-amber border-amber/30",
  CUSTOMER: "bg-dusty-blue/10 text-dusty-blue border-dusty-blue/30",
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  // Queries
  const { data: usersData, refetch: refetchUsers } = useListUsersQuery({ size: 100 });
  const { data: vendorsData } = useListUsersQuery({ size: 100, role: "VENDOR" } as any);
  const { data: eventsData } = useListEventsQuery({ size: 200 });
  const { data: requestsData, refetch: refetchReqs } = useGetAdminRequestsQuery();

  // Mutations
  const [approveReq] = useApproveRequestMutation();
  const [rejectReq] = useRejectRequestMutation();
  const [assignRole] = useAssignRoleMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [reactivateUser] = useReactivateUserMutation();
  const [gdprDelete] = useGdprDeleteMutation();

  // Vendor requests filters
  const [reqSearch, setReqSearch] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState("All statuses");
  const [reqShowCount, setReqShowCount] = useState(5);

  // User management filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All roles");
  const [userShowCount, setUserShowCount] = useState(5);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  // System account requests filters
  const [sysSearch, setSysSearch] = useState("");
  const [sysStatusFilter, setSysStatusFilter] = useState("Pending");
  const [sysTypeFilter, setSysTypeFilter] = useState("All request types");
  const [sysShowCount, setSysShowCount] = useState(5);

  // Confirm action modal
  const [confirmModal, setConfirmModal] = useState<{
    type: "deactivate" | "reactivate" | "gdpr";
    userId: string;
    name: string;
  } | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Derived data
  const allUsers: any[] = Array.isArray(usersData?.data)
    ? usersData.data
    : Array.isArray(usersData?.content)
    ? usersData.content
    : Array.isArray(usersData)
    ? usersData
    : [];
  const vendorUsers: any[] = Array.isArray(vendorsData?.data)
    ? vendorsData.data
    : Array.isArray(vendorsData?.content)
    ? vendorsData.content
    : Array.isArray(vendorsData)
    ? vendorsData
    : [];
  const events: any[] = Array.isArray(eventsData?.content)
    ? eventsData.content
    : Array.isArray(eventsData)
    ? eventsData
    : [];
  const requests: any[] = Array.isArray(requestsData)
    ? requestsData
    : Array.isArray(requestsData?.data)
    ? requestsData.data
    : Array.isArray(requestsData?.content)
    ? requestsData.content
    : [];

  const vendorRequests = requests.filter((r) => r.type === "VENDOR_ACCESS");
  const systemRequests = requests.filter((r) => r.type !== "VENDOR_ACCESS");
  const activeEvents = events.filter((e) => e.status === "PUBLISHED").length;
  const completedEvents = events.filter((e) => e.status === "COMPLETED");
  const ticketsSold = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);
  const pendingVendorReqs = vendorRequests.filter((r) => r.status === "PENDING").length;
  const pendingAccountReqs = systemRequests.filter((r) => r.status === "PENDING").length;
  const totalPending = requests.filter((r) => r.status === "PENDING").length;

  // Filtered vendor requests
  const filteredVendorReqs = vendorRequests
    .filter((r) => {
      const txt = `${r.name || ""} ${r.email || ""} ${r.reason || ""}`.toLowerCase();
      const matchSearch = !reqSearch || txt.includes(reqSearch.toLowerCase());
      const matchStatus = reqStatusFilter === "All statuses" || r.status === reqStatusFilter;
      return matchSearch && matchStatus;
    })
    .slice(0, reqShowCount);

  // Filtered users
  const filteredUsers = allUsers
    .filter((u) => {
      const txt = `${u.firstName || ""} ${u.lastName || ""} ${u.email || ""}`.toLowerCase();
      const matchSearch = !userSearch || txt.includes(userSearch.toLowerCase());
      const role = (u.roles?.[0] || u.role || "CUSTOMER").replace(/^ROLE_/, "").toUpperCase();
      const matchRole = userRoleFilter === "All roles" || role === userRoleFilter;
      return matchSearch && matchRole;
    })
    .slice(0, userShowCount);

  // Filtered system account requests
  const filteredSysReqs = systemRequests
    .filter((r) => {
      const txt = `${r.userId || ""} ${r.email || ""} ${r.type || ""}`.toLowerCase();
      const matchSearch = !sysSearch || txt.includes(sysSearch.toLowerCase());
      const matchStatus =
        sysStatusFilter === "Pending"
          ? r.status === "PENDING"
          : sysStatusFilter === "All statuses" || r.status === sysStatusFilter;
      const matchType = sysTypeFilter === "All request types" || r.type === sysTypeFilter;
      return matchSearch && matchStatus && matchType;
    })
    .slice(0, sysShowCount);

  const handleSaveRole = async (userId: string) => {
    const role = pendingRoles[userId];
    if (!role) return;
    try {
      await assignRole({ id: userId, roles: [role] }).unwrap();
      setPendingRoles((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    } catch {}
  };

  const handleConfirm = async () => {
    if (!confirmModal) return;
    try {
      if (confirmModal.type === "deactivate") await deactivateUser(confirmModal.userId).unwrap();
      else if (confirmModal.type === "reactivate") await reactivateUser(confirmModal.userId).unwrap();
      else await gdprDelete(confirmModal.userId).unwrap();
      setConfirmModal(null);
      refetchUsers();
    } catch {}
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await rejectReq({ id: rejectModal, adminNotes: rejectReason || undefined }).unwrap();
      setRejectModal(null);
      setRejectReason("");
    } catch {}
  };

  const quickLinks = [
    { label: "Event creation and management", path: "/admin/events", icon: Calendar },
    { label: "Venue creation and bookings", path: "/admin/venues", icon: Building2 },
    { label: "Customer check-in command center", path: "/admin/check-in", icon: UserCheck },
    { label: "Admin finance and reports", path: "/admin/finance", icon: IndianRupee },
  ];

  const stats = [
    { label: "Managed Users", value: allUsers.length, color: "bg-amber/10 text-amber", icon: Users },
    { label: "Active Events", value: activeEvents, color: "bg-sage/10 text-sage", icon: Calendar },
    { label: "Tickets Sold", value: ticketsSold, color: "bg-dusty-blue/10 text-dusty-blue", icon: Ticket },
    { label: "Pending Requests", value: totalPending, color: "bg-burgundy/10 text-burgundy", icon: AlertCircle },
    { label: "Pending Account Requests", value: pendingAccountReqs, color: "bg-warm-tan/40 text-near-black", icon: ShieldCheck },
    { label: "Pending Vendor Requests", value: pendingVendorReqs, color: "bg-amber/10 text-amber", icon: Store },
    { label: "Vendor Users", value: vendorUsers.length, color: "bg-sage/10 text-sage", icon: Store },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-body text-xs text-amber uppercase tracking-widest mb-1">ADMIN PORTAL</p>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
              Admin Dashboard
            </h1>
            <p className="font-body text-dark-gray text-sm">
              Full access across compliance, event operations, venue management, vendor approvals, finance, and reporting.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 flex-shrink-0"
            onClick={() => { refetchUsers(); refetchReqs(); }}
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>

        {/* Stats — 7 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-border-light rounded-lg p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon size={15} />
              </div>
              <p className="font-heading text-2xl font-bold text-near-black leading-none">{s.value}</p>
              <p className="font-body text-xs text-muted-gray mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((q) => (
            <button
              key={q.path}
              onClick={() => navigate(q.path)}
              className="flex items-center justify-between p-4 bg-white border border-border-light rounded-xl hover:border-amber hover:shadow-warm-sm transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center">
                  <q.icon size={17} className="text-amber" />
                </div>
                <span className="font-body text-sm font-medium text-near-black">{q.label}</span>
              </div>
              <ChevronRight size={15} className="text-muted-gray group-hover:text-amber transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Vendor / Event Ratings Overview */}
        {completedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber fill-amber" />
              <h2 className="font-heading text-base font-semibold text-near-black">Event &amp; Vendor Ratings</h2>
              <span className="font-body text-xs text-muted-gray">({completedEvents.length} completed)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {completedEvents.slice(0, 6).map((event: any) => (
                <AdminEventRatingCard key={event.eventId} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Management panels in 60:40 layout */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Left 60%: Access and Compliance */}
          <div className="lg:col-span-3">
            <Card hover={false} padding="lg">
              <h2 className="font-heading text-sm font-semibold text-near-black mb-0.5">
                Access and Compliance
              </h2>
              <p className="font-body text-xs text-muted-gray mb-4">
                One role per user, with searchable role assignment controls.
              </p>

              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name or email"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-border-light rounded-lg font-body focus:outline-none focus:border-amber"
                />
              </div>

              <div className="flex gap-2 mb-3">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="flex-1 text-xs border border-border-light rounded-lg px-2 py-1.5 font-body bg-white focus:outline-none focus:border-amber"
                >
                  {["All roles", "ADMIN", "VENDOR", "CUSTOMER"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={userShowCount}
                  onChange={(e) => setUserShowCount(Number(e.target.value))}
                  className="text-xs border border-border-light rounded-lg px-2 py-1.5 font-body bg-white focus:outline-none focus:border-amber"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>Show {n}</option>
                  ))}
                </select>
              </div>

              <p className="font-body text-xs text-muted-gray mb-3">
                Showing {filteredUsers.length} of {allUsers.length} users.
              </p>

              <div className="space-y-3 max-h-[920px] overflow-y-auto pr-0.5">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-xs text-muted-gray py-8">No users found.</p>
                ) : (
                  filteredUsers.map((u: any) => {
                    const userId = u.userId || u.id;
                    const currentRole = (u.roles?.[0] || u.role || "CUSTOMER")
                      .replace(/^ROLE_/, "")
                      .toUpperCase();
                    const selectedRole = pendingRoles[userId] ?? currentRole;
                    const isDirty = pendingRoles[userId] && pendingRoles[userId] !== currentRole;
                    const isActive = u.status === "ACTIVE" || !u.status;

                    return (
                      <div key={userId} className="border border-border-light rounded-lg p-3 bg-cream/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-dusty-blue/20 flex items-center justify-center flex-shrink-0">
                              <span className="font-heading text-xs font-bold text-dusty-blue">
                                {(u.firstName || u.email || "?").slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-body text-xs font-semibold text-near-black">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="font-body text-[10px] text-muted-gray">{u.email}</p>
                            </div>
                          </div>
                          <Badge
                            variant={isActive ? "success" : "neutral"}
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            {isActive ? "Active" : u.status || "Inactive"}
                          </Badge>
                        </div>

                        {/* Role toggles */}
                        <div className="flex gap-1 mb-1 flex-wrap">
                          {ROLES.map((role) => (
                            <button
                              key={role}
                              onClick={() =>
                                setPendingRoles((prev) => ({ ...prev, [userId]: role }))
                              }
                              className={`px-2 py-0.5 rounded text-[10px] border font-body transition-all ${
                                selectedRole === role
                                  ? ROLE_COLORS[role] + " font-semibold"
                                  : "border-border-light text-muted-gray hover:border-warm-tan"
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                        <p className="font-body text-[10px] text-muted-gray mb-2">
                          Current role: {currentRole}
                        </p>

                        {isDirty && (
                          <Button
                            size="sm"
                            className="text-[11px] py-0.5 px-2 h-auto gap-1 mb-2"
                            onClick={() => handleSaveRole(userId)}
                          >
                            <Save size={10} /> Save Role
                          </Button>
                        )}

                        {/* Direct account actions */}
                        <div className="pt-2 border-t border-border-light mt-1">
                          <div className="flex items-center gap-1 mb-1">
                            <TriangleAlert size={10} className="text-amber" />
                            <p className="font-body text-[10px] text-amber font-medium">
                              Direct Account Actions
                            </p>
                          </div>
                          <p className="font-body text-[10px] text-muted-gray mb-1.5">
                            Sensitive actions require confirmation before they are applied.
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            {isActive ? (
                              <button
                                onClick={() =>
                                  setConfirmModal({ type: "deactivate", userId, name: `${u.firstName} ${u.lastName}` })
                                }
                                className="px-2 py-0.5 rounded text-[10px] border border-border-light text-dark-gray hover:border-burgundy hover:text-burgundy font-body transition-all"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setConfirmModal({ type: "reactivate", userId, name: `${u.firstName} ${u.lastName}` })
                                }
                                className="px-2 py-0.5 rounded text-[10px] border border-border-light text-dark-gray hover:border-sage hover:text-sage font-body transition-all"
                              >
                                Reactivate
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setConfirmModal({ type: "gdpr", userId, name: `${u.firstName} ${u.lastName}` })
                              }
                              className="px-2 py-0.5 rounded text-[10px] bg-burgundy/10 border border-burgundy/20 text-burgundy hover:bg-burgundy hover:text-white font-body transition-all"
                            >
                              GDPR Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Right 40%: Request queues */}
          <div className="lg:col-span-2 space-y-6">

          {/* Vendor Requests */}
          <Card hover={false} padding="lg">
            <h2 className="font-heading text-sm font-semibold text-near-black mb-0.5">
              Manage Becoming a Vendor Requests
            </h2>
            <p className="font-body text-xs text-muted-gray mb-4">
              Compact queue with search, status filtering, and row limits.
            </p>

            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray" />
              <input
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
                placeholder="Search name, email, or note..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-border-light rounded-lg font-body focus:outline-none focus:border-amber"
              />
            </div>

            <div className="flex gap-2 mb-3">
              <select
                value={reqStatusFilter}
                onChange={(e) => setReqStatusFilter(e.target.value)}
                className="flex-1 text-xs border border-border-light rounded-lg px-2 py-1.5 font-body bg-white focus:outline-none focus:border-amber"
              >
                {["All statuses", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={reqShowCount}
                onChange={(e) => setReqShowCount(Number(e.target.value))}
                className="text-xs border border-border-light rounded-lg px-2 py-1.5 font-body bg-white focus:outline-none focus:border-amber"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>Show {n}</option>
                ))}
              </select>
            </div>

            <p className="font-body text-xs text-muted-gray mb-3">
              Showing {filteredVendorReqs.length} of {vendorRequests.length} requests.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
              {filteredVendorReqs.length === 0 ? (
                <p className="text-center text-xs text-muted-gray py-8">No vendor requests found.</p>
              ) : (
                filteredVendorReqs.map((r: any) => (
                  <div key={r.requestId || r.id} className="border border-border-light rounded-lg p-3 bg-cream/30">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-heading text-xs font-bold text-sage">
                          {(r.name || r.email || "?").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-body text-xs font-semibold text-near-black truncate">
                            {r.name || r.email?.split("@")[0] || "Unknown"}
                          </p>
                          <Badge
                            variant={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : r.status === "PENDING" ? "warning" : "neutral"}
                            className="text-[10px] px-1.5 py-0.5 flex-shrink-0"
                          >
                            {r.status}
                          </Badge>
                        </div>
                        <p className="font-body text-[10px] text-muted-gray">{r.email}</p>
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-gray mb-1 italic">
                      {r.reason || "No note provided."}
                    </p>
                    <p className="font-body text-[10px] text-muted-gray mb-2">
                      Submitted{" "}
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString("en-US", {
                            month: "numeric", day: "numeric", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })
                        : "—"}
                    </p>
                    {r.status === "PENDING" && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="text-[11px] py-0.5 px-2 h-auto"
                          onClick={() => approveReq(r.requestId || r.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] py-0.5 px-2 h-auto text-burgundy"
                          onClick={() => setRejectModal(r.requestId || r.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* System Account Requests */}
          <Card hover={false} padding="lg">
            <h2 className="font-heading text-sm font-semibold text-near-black mb-0.5">
              System Account Requests
            </h2>
            <p className="font-body text-xs text-muted-gray mb-4">
              Review deactivate, reactivate, and GDPR delete requests with compact filters.
            </p>

            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray" />
              <input
                value={sysSearch}
                onChange={(e) => setSysSearch(e.target.value)}
                placeholder="Search user, email, type, or reason"
                className="w-full pl-8 pr-3 py-2 text-xs border border-border-light rounded-lg font-body focus:outline-none focus:border-amber"
              />
            </div>

            <div className="flex gap-2 mb-3 flex-wrap">
              <select
                value={sysStatusFilter}
                onChange={(e) => setSysStatusFilter(e.target.value)}
                className="flex-1 min-w-0 text-xs border border-border-light rounded-lg px-2 py-1.5 font-body bg-white focus:outline-none focus:border-amber"
              >
                {["Pending", "All statuses", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={sysTypeFilter}
                onChange={(e) => setSysTypeFilter(e.target.value)}
                className="flex-1 min-w-0 text-xs border border-border-light rounded-lg px-2 py-1.5 font-body bg-white focus:outline-none focus:border-amber"
              >
                {["All request types", "VENDOR_ACCESS", "ROLE_CHANGE", "DEACTIVATE", "GDPR_DELETE"].map(
                  (t) => <option key={t}>{t}</option>
                )}
              </select>
              <select
                value={sysShowCount}
                onChange={(e) => setSysShowCount(Number(e.target.value))}
                className="text-xs border border-border-light rounded-lg px-2 py-1.5 font-body bg-white focus:outline-none focus:border-amber"
              >
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>Show {n}</option>
                ))}
              </select>
            </div>

            <p className="font-body text-xs text-muted-gray mb-3">
              Showing {filteredSysReqs.length} of {systemRequests.length} requests.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
              {filteredSysReqs.length === 0 ? (
                <p className="text-center text-xs text-muted-gray py-8">
                  No system account requests match the current filters.
                </p>
              ) : (
                filteredSysReqs.map((r: any) => (
                  <div key={r.requestId || r.id} className="border border-border-light rounded-lg p-3 bg-cream/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-body text-xs font-semibold text-near-black">
                        {r.type?.replace(/_/g, " ")}
                      </p>
                      <Badge
                        variant={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "warning"}
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="font-body text-[10px] text-muted-gray mb-1">
                      User: {r.userId?.slice(0, 14)}...
                    </p>
                    {r.reason && (
                      <p className="font-body text-[10px] text-muted-gray italic mb-1">
                        "{r.reason}"
                      </p>
                    )}
                    <p className="font-body text-[10px] text-muted-gray mb-2">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })
                        : "—"}
                    </p>
                    {r.status === "PENDING" && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="text-[11px] py-0.5 px-2 h-auto"
                          onClick={() => approveReq(r.requestId || r.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] py-0.5 px-2 h-auto text-burgundy"
                          onClick={() => setRejectModal(r.requestId || r.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {r.adminNotes && (
                      <p className="font-body text-[10px] text-muted-gray italic mt-1">
                        Note: {r.adminNotes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
          </div>
        </div>
      </div>

      {/* Confirm action modal */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title="Confirm Action" size="sm">
        <div className="space-y-4">
          <p className="font-body text-sm text-dark-gray">
            {confirmModal?.type === "deactivate" &&
              `Deactivate ${confirmModal.name}? They will be unable to log in until reactivated.`}
            {confirmModal?.type === "reactivate" &&
              `Reactivate ${confirmModal.name}? They will regain access to the platform.`}
            {confirmModal?.type === "gdpr" &&
              `Permanently delete all personal data for ${confirmModal.name}? This action cannot be undone.`}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button
              className={confirmModal?.type === "gdpr" ? "bg-burgundy hover:bg-burgundy/90" : ""}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject request modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => { setRejectModal(null); setRejectReason(""); }}
        title="Reject Request"
        size="sm"
      >
        <div className="space-y-4">
          <p className="font-body text-sm text-dark-gray">
            Optionally provide a reason for the rejection.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Reason (optional)..."
            className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber transition-all resize-none"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setRejectModal(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button className="bg-burgundy hover:bg-burgundy/90" onClick={handleReject}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
