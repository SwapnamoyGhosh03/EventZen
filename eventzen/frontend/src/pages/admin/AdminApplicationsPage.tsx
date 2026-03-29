import { useState } from "react";
import { ClipboardCheck, Check, X, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  useGetAdminRequestsQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
} from "@/store/api/authApi";

const statusIcons: Record<string, typeof Clock> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  CANCELLED: AlertCircle,
};

const statusVariant: Record<string, "info" | "success" | "danger" | "neutral"> = {
  PENDING: "info",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

export default function AdminApplicationsPage() {
  const { data, isLoading } = useGetAdminRequestsQuery();
  const [approveRequest, { isLoading: isApproving }] = useApproveRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectRequestMutation();

  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const requests = data?.data || data || [];
  const list = Array.isArray(requests) ? requests : [];

  const pending = list.filter((r: any) => r.status === "PENDING");
  const resolved = list.filter((r: any) => r.status !== "PENDING");

  const handleApprove = async (id: string) => {
    try {
      await approveRequest(id).unwrap();
    } catch {}
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await rejectRequest({ id: rejectModal, adminNotes: rejectReason || undefined }).unwrap();
      setRejectModal(null);
      setRejectReason("");
    } catch {}
  };

  const columns = [
    {
      key: "type",
      header: "Request",
      render: (r: any) => {
        const Icon = statusIcons[r.status] || Clock;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
              <Icon size={18} className={r.status === "PENDING" ? "text-amber" : "text-muted-gray"} />
            </div>
            <div>
              <p className="font-body text-sm font-medium text-near-black">
                {r.type === "VENDOR_ACCESS" ? "Vendor Access" : r.type}
              </p>
              <p className="font-body text-xs text-muted-gray">
                User: {r.userId?.slice(0, 8)}...
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "reason",
      header: "Reason",
      render: (r: any) => (
        <p className="font-body text-sm text-dark-gray max-w-xs truncate" title={r.reason || ""}>
          {r.reason || "No reason provided"}
        </p>
      ),
    },
    {
      key: "date",
      header: "Submitted",
      render: (r: any) =>
        r.createdAt ? (
          <span className="font-body text-sm text-dark-gray">
            {new Date(r.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: any) => (
        <Badge variant={statusVariant[r.status] || "neutral"}>{r.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r: any) =>
        r.status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleApprove(r.requestId)}
              isLoading={isApproving}
              className="gap-1"
            >
              <Check size={14} /> Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-burgundy gap-1"
              onClick={() => setRejectModal(r.requestId)}
            >
              <X size={14} /> Reject
            </Button>
          </div>
        ) : r.adminNotes ? (
          <span className="font-body text-xs text-muted-gray italic" title={r.adminNotes}>
            Note: {r.adminNotes.slice(0, 30)}...
          </span>
        ) : null,
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
              Vendor Applications
            </h1>
            <p className="font-body text-dark-gray">
              Review and manage vendor access requests from customers
            </p>
          </div>
          {pending.length > 0 && (
            <Badge variant="info" className="text-base px-3 py-1">
              {pending.length} Pending
            </Badge>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending", count: pending.length, icon: Clock, color: "bg-amber/10 text-amber" },
            { label: "Approved", count: list.filter((r: any) => r.status === "APPROVED").length, icon: CheckCircle, color: "bg-sage/10 text-sage" },
            { label: "Rejected", count: list.filter((r: any) => r.status === "REJECTED").length, icon: XCircle, color: "bg-burgundy/10 text-burgundy" },
            { label: "Total", count: list.length, icon: ClipboardCheck, color: "bg-dusty-blue/10 text-dusty-blue" },
          ].map((s) => (
            <Card key={s.label} hover={false} padding="lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon size={18} />
                </div>
                <div>
                  <p className="font-body text-2xl font-bold text-near-black">{s.count}</p>
                  <p className="font-body text-xs text-muted-gray">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pending requests table */}
        {pending.length > 0 && (
          <>
            <h2 className="font-heading text-lg font-semibold text-near-black">
              Pending Review
            </h2>
            <Card hover={false} padding="none">
              <Table
                columns={columns}
                data={pending}
                keyExtractor={(r: any) => r.requestId}
                emptyMessage="No pending requests"
              />
            </Card>
          </>
        )}

        {/* Resolved requests */}
        {resolved.length > 0 && (
          <>
            <h2 className="font-heading text-lg font-semibold text-near-black">
              Resolved
            </h2>
            <Card hover={false} padding="none">
              <Table
                columns={columns}
                data={resolved}
                keyExtractor={(r: any) => r.requestId}
                emptyMessage="No resolved requests"
              />
            </Card>
          </>
        )}

        {list.length === 0 && !isLoading && (
          <Card hover={false} padding="lg">
            <div className="text-center py-8">
              <ClipboardCheck size={40} className="text-muted-gray mx-auto mb-3" />
              <p className="font-body text-muted-gray">No vendor applications yet</p>
            </div>
          </Card>
        )}

        {/* Reject modal */}
        <Modal
          isOpen={!!rejectModal}
          onClose={() => {
            setRejectModal(null);
            setRejectReason("");
          }}
          title="Reject Application"
          size="sm"
        >
          <div className="space-y-4">
            <p className="font-body text-sm text-dark-gray">
              Optionally provide a reason for rejection. The applicant will see this note.
            </p>
            <div>
              <label className="block text-sm font-medium text-near-black mb-1.5 font-body">
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. Insufficient information provided..."
                className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                isLoading={isRejecting}
                className="bg-burgundy hover:bg-burgundy/90 gap-1"
              >
                <X size={16} /> Reject
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
