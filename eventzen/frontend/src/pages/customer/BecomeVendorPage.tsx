import { useState } from "react";
import { Package, Clock, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  useSubmitAccountRequestMutation,
  useGetMyRequestsQuery,
  useCancelRequestMutation,
} from "@/store/api/authApi";

const statusConfig: Record<string, { icon: typeof Clock; color: string; variant: "info" | "success" | "danger" | "neutral" }> = {
  PENDING: { icon: Clock, color: "text-amber", variant: "info" },
  APPROVED: { icon: CheckCircle, color: "text-sage", variant: "success" },
  REJECTED: { icon: XCircle, color: "text-burgundy", variant: "danger" },
  CANCELLED: { icon: AlertCircle, color: "text-muted-gray", variant: "neutral" },
};

export default function BecomeVendorPage() {
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { data: requestsData } = useGetMyRequestsQuery();
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitAccountRequestMutation();
  const [cancelRequest] = useCancelRequestMutation();

  const requests = requestsData?.data || requestsData || [];
  const vendorRequests = (Array.isArray(requests) ? requests : []).filter(
    (r: any) => r.type === "VENDOR_ACCESS"
  );
  const hasPending = vendorRequests.some((r: any) => r.status === "PENDING");
  const wasApproved = vendorRequests.some((r: any) => r.status === "APPROVED");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      await submitRequest({ type: "VENDOR_ACCESS", reason }).unwrap();
      setSuccess(true);
      setReason("");
    } catch (err: any) {
      setError(err?.data?.error?.message || "Failed to submit request. Please try again.");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelRequest(id).unwrap();
    } catch {}
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            Become a Vendor
          </h1>
          <p className="font-body text-dark-gray">
            Apply for vendor access to create events, manage venues, and access business tools.
          </p>
        </div>

        {/* Benefits */}
        <Card hover={false} padding="lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-amber" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-near-black mb-2">
                What you get as a Vendor
              </h2>
              <ul className="font-body text-sm text-dark-gray space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-sage flex-shrink-0" />
                  Create and manage events with full organizer tools
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-sage flex-shrink-0" />
                  Access venue booking and vendor contract management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-sage flex-shrink-0" />
                  Financial dashboards, budgets, and expense tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-sage flex-shrink-0" />
                  Real-time analytics and attendee check-in tools
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Previous requests */}
        {vendorRequests.length > 0 && (
          <Card hover={false} padding="lg">
            <h3 className="font-heading text-base font-semibold text-near-black mb-3">
              Your Applications
            </h3>
            <div className="space-y-3">
              {vendorRequests.map((req: any) => {
                const cfg = statusConfig[req.status] || statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <div
                    key={req.requestId}
                    className="flex items-center justify-between py-3 border-b border-border-light last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={cfg.color} />
                      <div>
                        <p className="font-body text-sm font-medium text-near-black">
                          Vendor Access Request
                        </p>
                        <p className="font-body text-xs text-muted-gray">
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </p>
                        {req.adminNotes && (
                          <p className="font-body text-xs text-burgundy mt-1">
                            Admin: {req.adminNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.variant}>{req.status}</Badge>
                      {req.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-burgundy"
                          onClick={() => handleCancel(req.requestId)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Application form */}
        {wasApproved ? (
          <Card hover={false} padding="lg">
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-sage mx-auto mb-3" />
              <h3 className="font-heading text-lg font-semibold text-near-black mb-1">
                You're already a Vendor!
              </h3>
              <p className="font-body text-sm text-dark-gray">
                Your vendor access has been approved. Log out and sign in again to access the vendor portal.
              </p>
            </div>
          </Card>
        ) : hasPending ? (
          <Card hover={false} padding="lg">
            <div className="text-center py-4">
              <Clock size={40} className="text-amber mx-auto mb-3" />
              <h3 className="font-heading text-lg font-semibold text-near-black mb-1">
                Application Under Review
              </h3>
              <p className="font-body text-sm text-dark-gray">
                Your vendor application is being reviewed by our admin team. You'll be notified once a decision is made.
              </p>
            </div>
          </Card>
        ) : success ? (
          <Card hover={false} padding="lg">
            <div className="text-center py-4">
              <Send size={40} className="text-sage mx-auto mb-3" />
              <h3 className="font-heading text-lg font-semibold text-near-black mb-1">
                Application Submitted!
              </h3>
              <p className="font-body text-sm text-dark-gray">
                Your request has been sent to the admin team for review. We'll notify you once a decision is made.
              </p>
            </div>
          </Card>
        ) : (
          <Card hover={false} padding="lg">
            <h3 className="font-heading text-base font-semibold text-near-black mb-4">
              Apply for Vendor Access
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-burgundy/5 border border-burgundy/20 text-burgundy rounded-md p-3 font-body text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-near-black mb-1.5 font-body">
                  Why do you want to become a vendor? <span className="text-burgundy">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  required
                  placeholder="Tell us about your business, the types of events you plan to organize, or the services you offer..."
                  className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isSubmitting} className="gap-2">
                  <Send size={16} />
                  Submit Application
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
