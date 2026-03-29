import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Users } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useGetEventQuery } from "@/store/api/eventApi";
import { useGetEventRegistrationsQuery } from "@/store/api/ticketApi";
import { formatShortDate, formatCurrency } from "@/utils/formatters";

function downloadCSV(registrations: any[], eventTitle: string) {
  const headers = [
    "Name",
    "Email",
    "Status",
    "Amount Paid",
    "Registration Date",
    "Ticket Type ID",
    "Registration ID",
  ];
  const rows = registrations.map((r: any) => [
    r.attendeeName || r.attendeeId || "—",
    r.attendeeEmail || "—",
    r.status || "—",
    r.amountPaid ?? 0,
    r.registeredAt ? new Date(r.registeredAt).toLocaleDateString("en-IN") : "—",
    r.ticketTypeId || "—",
    r.registrationId || r.id || "—",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, "_")}_registrations.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function EventRegistrationsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const { data: event } = useGetEventQuery(eventId!);
  const { data: regData, isLoading } = useGetEventRegistrationsQuery({
    eventId: eventId!,
  });

  const raw = regData?.data ?? regData;
  const registrations = Array.isArray(raw) ? raw : raw?.content || [];

  const confirmed = registrations.filter((r: any) => r.status === "CONFIRMED").length;
  const cancelled = registrations.filter((r: any) => r.status === "CANCELLED").length;
  const waitlisted = registrations.filter((r: any) => r.status === "WAITLISTED").length;

  const columns = [
    {
      key: "attendee",
      header: "Attendee",
      render: (r: any) => (
        <div>
          <p className="font-body text-sm font-medium text-near-black">
            {r.attendeeName || "—"}
          </p>
          {r.attendeeEmail && (
            <p className="font-body text-xs text-muted-gray">{r.attendeeEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (r: any) => (
        <span className="font-body text-sm text-dark-gray">
          {r.attendeeEmail || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: any) => (
        <Badge
          variant={
            r.status === "CONFIRMED"
              ? "success"
              : r.status === "CANCELLED"
                ? "danger"
                : "warning"
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: "amountPaid",
      header: "Amount",
      render: (r: any) => (
        <span className="font-body text-sm text-near-black">
          {formatCurrency(r.amountPaid ?? 0)}
        </span>
      ),
    },
    {
      key: "registeredAt",
      header: "Registered",
      render: (r: any) => (
        <span className="font-body text-sm text-dark-gray">
          {r.registeredAt ? formatShortDate(r.registeredAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 font-body text-sm text-muted-gray hover:text-amber transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Events
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
                Registrations
              </h1>
              {event && (
                <p className="font-body text-dark-gray">
                  {event.title} &middot; {event.city || ""}
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() =>
                downloadCSV(registrations, event?.title || "event")
              }
              disabled={registrations.length === 0}
            >
              <Download size={16} />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hover={false} padding="lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
                <Users size={20} className="text-amber" />
              </div>
              <div>
                <p className="font-body text-xs text-muted-gray">Total</p>
                <p className="font-heading text-xl font-bold text-near-black">
                  {registrations.length}
                </p>
              </div>
            </div>
          </Card>
          <Card hover={false} padding="lg">
            <div>
              <p className="font-body text-xs text-muted-gray">Confirmed</p>
              <p className="font-heading text-xl font-bold text-sage">
                {confirmed}
              </p>
            </div>
          </Card>
          <Card hover={false} padding="lg">
            <div>
              <p className="font-body text-xs text-muted-gray">Waitlisted</p>
              <p className="font-heading text-xl font-bold text-amber">
                {waitlisted}
              </p>
            </div>
          </Card>
          <Card hover={false} padding="lg">
            <div>
              <p className="font-body text-xs text-muted-gray">Cancelled</p>
              <p className="font-heading text-xl font-bold text-burgundy">
                {cancelled}
              </p>
            </div>
          </Card>
        </div>

        {/* Registrations table */}
        <Card hover={false} padding="none">
          {isLoading ? (
            <div className="text-center py-12 text-muted-gray font-body">
              Loading registrations...
            </div>
          ) : (
            <Table
              columns={columns}
              data={registrations}
              keyExtractor={(r: any) => r.registrationId || r.id || r._id}
              emptyMessage="No registrations yet for this event."
            />
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
