import { motion } from "framer-motion";
import { Calendar, XCircle } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useGetMyRegistrationsQuery, useCancelRegistrationMutation } from "@/store/api/ticketApi";
import { formatShortDate, formatCurrency } from "@/utils/formatters";
import { useState } from "react";
import Modal from "@/components/ui/Modal";

export default function MyRegistrationsPage() {
  const { data, isLoading } = useGetMyRegistrationsQuery();
  const [cancelReg, { isLoading: isCancelling }] = useCancelRegistrationMutation();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const registrations = data?.content || data || [];

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelReg(cancelId).unwrap();
      setCancelId(null);
    } catch {
      // handled by toast
    }
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-6">
          My Registrations
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : registrations.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title="No Registrations"
            description="You haven't registered for any events yet."
            action={{ label: "Find Events", onClick: () => window.location.href = "/events" }}
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-4"
          >
            {registrations.map((reg: any) => (
              <motion.div
                key={reg.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                <Card hover={false}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-near-black mb-1">
                        {reg.eventTitle || reg.eventName || "Event"}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-muted-gray">
                        {reg.registrationDate && (
                          <span className="font-body text-sm">
                            Registered: {formatShortDate(reg.registrationDate)}
                          </span>
                        )}
                        {reg.amount !== undefined && (
                          <span className="font-body text-sm">
                            Paid: {formatCurrency(reg.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          reg.status === "CONFIRMED"
                            ? "success"
                            : reg.status === "CANCELLED"
                              ? "danger"
                              : "info"
                        }
                      >
                        {reg.status || "Confirmed"}
                      </Badge>
                      {reg.status !== "CANCELLED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelId(reg.id)}
                          className="text-burgundy hover:bg-burgundy/5"
                        >
                          <XCircle size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Cancel Modal */}
        <Modal
          isOpen={!!cancelId}
          onClose={() => setCancelId(null)}
          title="Cancel Registration"
          size="sm"
        >
          <p className="font-body text-dark-gray mb-6">
            Are you sure you want to cancel this registration? This action cannot
            be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setCancelId(null)}>
              Keep Registration
            </Button>
            <Button
              variant="accent"
              isLoading={isCancelling}
              onClick={handleCancel}
            >
              Yes, Cancel
            </Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
