import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Mail, Phone, ShieldCheck, Calendar, Ticket } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useListUsersQuery } from "@/store/api/authApi";
import { useListEventsQuery } from "@/store/api/eventApi";
import { formatShortDate } from "@/utils/formatters";
import EventStatusBadge from "@/components/events/EventStatusBadge";
import TicketManagementModal from "@/components/tickets/TicketManagementModal";

export default function AdminVendorsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useListUsersQuery({ size: 100, role: "VENDOR" } as any);
  const [vendorEventsModal, setVendorEventsModal] = useState<any>(null);
  const [ticketModal, setTicketModal] = useState<any>(null);

  const raw = data?.data ?? data;
  const vendors = Array.isArray(raw) ? raw : raw?.content || [];

  const columns = [
    { key: "name", header: "Vendor", render: (v: any) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
          <ShieldCheck size={18} className="text-amber" />
        </div>
        <div>
          <p className="font-body text-sm font-medium text-near-black">
            {v.firstName} {v.lastName}
          </p>
          <p className="font-body text-xs text-muted-gray">{v.email}</p>
        </div>
      </div>
    )},
    { key: "email", header: "Email", render: (v: any) => (
      <div className="flex items-center gap-1.5 font-body text-sm text-dark-gray">
        <Mail size={14} className="text-muted-gray" />
        {v.email}
      </div>
    )},
    { key: "phone", header: "Phone", render: (v: any) => (
      <div className="flex items-center gap-1.5 font-body text-sm text-dark-gray">
        <Phone size={14} className="text-muted-gray" />
        {v.phone || "—"}
      </div>
    )},
    { key: "joined", header: "Joined", render: (v: any) => (
      <span className="font-body text-sm text-dark-gray">
        {v.createdAt ? formatShortDate(v.createdAt) : "—"}
      </span>
    )},
    { key: "status", header: "Status", render: (v: any) => (
      <Badge variant={v.status === "ACTIVE" ? "success" : "neutral"}>
        {v.status || "Active"}
      </Badge>
    )},
    { key: "actions", header: "Actions", render: (v: any) => (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={() => setVendorEventsModal(v)}
      >
        <Calendar size={14} /> View Events
      </Button>
    )},
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black">
              Vendor Administration
            </h1>
            <p className="font-body text-dark-gray mt-1">
              Users registered with the Vendor role
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-amber" />
            <span className="font-heading text-lg font-semibold text-near-black">
              {vendors.length}
            </span>
          </div>
        </div>

        {error ? (
          <Card hover={false}>
            <p className="text-burgundy font-body text-sm">Failed to load vendors. Please check that the auth service is running.</p>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4">{[1, 2, 3].map(i => <Card key={i} hover={false}><div className="h-12 bg-border-light/50 rounded animate-pulse" /></Card>)}</div>
        ) : (
          <Card hover={false} padding="none">
            <Table columns={columns} data={vendors} keyExtractor={(v: any) => v.userId || v.id} emptyMessage="No registered vendors" />
          </Card>
        )}
      </div>

      {/* Vendor Events Modal */}
      {vendorEventsModal && (
        <VendorEventsModal
          vendor={vendorEventsModal}
          onClose={() => setVendorEventsModal(null)}
          onManageTickets={(event) => {
            setVendorEventsModal(null);
            setTicketModal(event);
          }}
        />
      )}

      {ticketModal && (
        <TicketManagementModal
          event={ticketModal}
          onClose={() => setTicketModal(null)}
        />
      )}
    </PageTransition>
  );
}

function VendorEventsModal({
  vendor,
  onClose,
  onManageTickets,
}: {
  vendor: any;
  onClose: () => void;
  onManageTickets: (event: any) => void;
}) {
  const navigate = useNavigate();
  const { data, isLoading } = useListEventsQuery({ organizerId: vendor.userId || vendor.id, size: 50 });
  const events = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Events by ${vendor.firstName} ${vendor.lastName}`}
      size="lg"
    >
      {isLoading ? (
        <p className="font-body text-sm text-muted-gray text-center py-8">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="font-body text-sm text-muted-gray text-center py-8">This vendor has no events yet.</p>
      ) : (
        <div className="space-y-2">
          {events.map((e: any) => (
            <div
              key={e.eventId}
              className="flex items-center gap-3 p-3 bg-cream rounded-lg border border-border-light"
            >
              {(e.imageUrls?.[0] || e.bannerUrl) && (
                <img
                  src={e.imageUrls?.[0] || e.bannerUrl}
                  alt={e.title}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-near-black truncate">{e.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <EventStatusBadge status={e.status} />
                  {e.startDate && (
                    <span className="font-body text-xs text-muted-gray">{formatShortDate(e.startDate)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => onManageTickets(e)}
                >
                  <Ticket size={13} /> Tickets
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => { onClose(); navigate(`/admin/events/${e.eventId}/registrations`); }}
                >
                  <Users size={13} /> Regs
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
