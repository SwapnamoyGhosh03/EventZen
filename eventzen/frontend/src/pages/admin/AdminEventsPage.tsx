import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Users, Ticket, Pencil, Archive, Trash2, RotateCcw, FlagOff, Star } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import EventStatusBadge from "@/components/events/EventStatusBadge";
import EventFilters from "@/components/events/EventFilters";
import Pagination from "@/components/ui/Pagination";
import TicketManagementModal from "@/components/tickets/TicketManagementModal";
import RatingDisplay from "@/components/reviews/RatingDisplay";
import EventReviewsModal from "@/components/reviews/EventReviewsModal";
import { useListEventsQuery, useUpdateEventMutation, useUpdateEventStatusMutation, useDeleteEventMutation, useGetCategoriesQuery } from "@/store/api/eventApi";
import DateTimePicker from "@/components/ui/DateTimePicker";
import ImageUploader from "@/components/ui/ImageUploader";
import { formatShortDate } from "@/utils/formatters";
import { EVENT_STATUSES } from "@/config/constants";

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [statusModal, setStatusModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [ticketModal, setTicketModal] = useState<any>(null);
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", city: "", startDate: "", endDate: "", maxCapacity: "", categoryId: "" });
  const [editEventImages, setEditEventImages] = useState<string[]>([]);
  const [editError, setEditError] = useState("");
  const [reviewsModal, setReviewsModal] = useState<{ eventId: string; title: string } | null>(null);

  const { data, isLoading } = useListEventsQuery({ page: page - 1, size: 50, ...filters });
  const { data: archivedData } = useListEventsQuery({ page: 0, size: 200, status: "ARCHIVED" });
  const { data: completedData } = useListEventsQuery({ page: 0, size: 200, status: "COMPLETED" });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateEventStatusMutation();
  const [updateEvent, { isLoading: isEditing }] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const openEdit = (e: any) => {
    setEditModal(e);
    setEditForm({
      title: e.title || "",
      description: e.description || "",
      city: e.city || "",
      startDate: e.startDate ? e.startDate.slice(0, 16) : "",
      endDate: e.endDate ? e.endDate.slice(0, 16) : "",
      maxCapacity: e.maxCapacity != null ? String(e.maxCapacity) : "",
      categoryId: e.categoryId || "",
    });
    const existingImages = Array.isArray(e.imageUrls) && e.imageUrls.length > 0
      ? e.imageUrls
      : e.bannerUrl
      ? [e.bannerUrl]
      : [];
    setEditEventImages(existingImages);
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editModal) return;
    setEditError("");
    try {
      await updateEvent({
        id: editModal.eventId,
        data: {
          title: editForm.title || undefined,
          description: editForm.description || undefined,
          city: editForm.city || undefined,
          startDate: editForm.startDate || undefined,
          endDate: editForm.endDate || undefined,
          maxCapacity: editForm.maxCapacity !== "" ? Number(editForm.maxCapacity) : undefined,
          categoryId: editForm.categoryId || undefined,
          imageUrls: editEventImages,
          bannerUrl: editEventImages[0] || "",
        },
      }).unwrap();
      setEditModal(null);
      setEditEventImages([]);
    } catch (err: any) {
      setEditError(err?.data?.message || "Failed to update event");
    }
  };

  const events = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
  const totalPages = data?.meta?.totalPages || 1;

  const pendingEvents = events.filter((e: any) => e.status === "DRAFT");
  const activeEvents = events.filter((e: any) => e.status !== "DRAFT" && e.status !== "ARCHIVED" && e.status !== "COMPLETED");
  const archivedRaw = Array.isArray(archivedData?.content) ? archivedData.content : Array.isArray(archivedData) ? archivedData : [];
  const completedRaw = Array.isArray(completedData?.content) ? completedData.content : Array.isArray(completedData) ? completedData : [];
  const archivedEvents = archivedRaw;
  const completedEvents = completedRaw;

  const handleArchive = async (eventId: string) => {
    try { await updateStatus({ id: eventId, status: "ARCHIVED" }).unwrap(); } catch {}
  };
  const handleComplete = async (eventId: string) => {
    try { await updateStatus({ id: eventId, status: "COMPLETED" }).unwrap(); } catch {}
  };
  const handleRestore = async (eventId: string) => {
    try { await updateStatus({ id: eventId, status: "DRAFT" }).unwrap(); } catch {}
  };
  const handleDelete = async (eventId: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    try { await deleteEvent(eventId).unwrap(); } catch {}
  };

  const handleApprove = async (eventId: string) => {
    try { await updateStatus({ id: eventId, status: "PUBLISHED" }).unwrap(); } catch {}
  };
  const handleReject = async (eventId: string) => {
    try { await updateStatus({ id: eventId, status: "ARCHIVED" }).unwrap(); } catch {}
  };

  const handleStatusChange = async () => {
    if (!statusModal || !newStatus) return;
    try {
      await updateStatus({ id: statusModal.eventId, status: newStatus }).unwrap();
      setStatusModal(null);
      setNewStatus("");
    } catch {}
  };

  const pendingColumns = [
    { key: "title", header: "Event", render: (e: any) => (
      <div>
        <p className="font-body text-sm font-medium text-near-black">{e.title}</p>
        <p className="font-body text-xs text-muted-gray">{e.city}</p>
      </div>
    )},
    { key: "category", header: "Category", render: (e: any) => e.categoryName || "—" },
    { key: "date", header: "Date", render: (e: any) => e.startDate ? formatShortDate(e.startDate) : "—" },
    { key: "capacity", header: "Capacity", render: (e: any) => e.maxCapacity || "—" },
    { key: "actions", header: "Actions", render: (e: any) => (
      <div className="flex gap-2">
        <Button size="sm" className="gap-1" onClick={() => handleApprove(e.eventId)}>
          <CheckCircle size={14} /> Approve
        </Button>
        <Button variant="ghost" size="sm" className="text-burgundy gap-1" onClick={() => handleReject(e.eventId)}>
          <XCircle size={14} /> Reject
        </Button>
      </div>
    )},
  ];

  const columns = [
    { key: "title", header: "Event", render: (e: any) => (
      <div>
        <p className="font-body text-sm font-medium text-near-black">{e.title}</p>
        <p className="font-body text-xs text-muted-gray">{e.city}</p>
      </div>
    )},
    { key: "category", header: "Category", render: (e: any) => e.categoryName || "—" },
    { key: "startDate", header: "Date", render: (e: any) => e.startDate ? formatShortDate(e.startDate) : "—" },
    { key: "status", header: "Status", render: (e: any) => <EventStatusBadge status={e.status} /> },
    { key: "actions", header: "Actions", render: (e: any) => (
      <div className="flex gap-2 flex-wrap">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(e)}>
          <Pencil size={14} /> Edit
        </Button>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setTicketModal(e)}>
          <Ticket size={14} /> Tickets
        </Button>
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/admin/events/${e.eventId}/registrations`)}>
          <Users size={14} /> Registrations
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setStatusModal(e); setNewStatus(e.status); }}>
          Status
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-sage" onClick={() => handleComplete(e.eventId)}>
          <FlagOff size={14} /> Mark Complete
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-amber" onClick={() => handleArchive(e.eventId)}>
          <Archive size={14} /> Archive
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 text-burgundy" onClick={() => handleDelete(e.eventId, e.title)}>
          <Trash2 size={14} /> Delete
        </Button>
      </div>
    )},
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black">
          Event Administration
        </h1>

        <EventFilters onFilter={(f) => { setFilters(f); setPage(1); }} />

        {pendingEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-near-black">Pending Approval</h2>
              <Badge variant="warning">{pendingEvents.length}</Badge>
            </div>
            <Card hover={false} padding="none">
              <Table columns={pendingColumns} data={pendingEvents} keyExtractor={(e: any) => e.eventId} emptyMessage="" />
            </Card>
          </div>
        )}

        <h2 className="font-heading text-lg font-semibold text-near-black">Active Events</h2>
        <Card hover={false} padding="none">
          <Table columns={columns} data={activeEvents.length > 0 ? activeEvents : events.filter((e: any) => e.status !== "DRAFT" && e.status !== "COMPLETED")} keyExtractor={(e: any) => e.eventId} emptyMessage="No active events found" />
        </Card>

        {/* Completed Events */}
        {completedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-near-black">Completed Events</h2>
              <Badge variant="success">{completedEvents.length}</Badge>
            </div>
            <Card hover={false} padding="none">
              <Table
                columns={[
                  { key: "title", header: "Event", render: (e: any) => (
                    <div>
                      <p className="font-body text-sm font-medium text-near-black">{e.title}</p>
                      <p className="font-body text-xs text-muted-gray">{e.city}</p>
                    </div>
                  )},
                  { key: "category", header: "Category", render: (e: any) => e.categoryName || "—" },
                  { key: "startDate", header: "Date", render: (e: any) => e.startDate ? formatShortDate(e.startDate) : "—" },
                  { key: "rating", header: "Attendee Rating", render: (e: any) => (
                    <RatingDisplay eventId={e.eventId} />
                  )},
                  { key: "actions", header: "Actions", render: (e: any) => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/admin/events/${e.eventId}/registrations`)}>
                        <Users size={14} /> Registrations
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1 text-amber" onClick={() => setReviewsModal({ eventId: e.eventId, title: e.title })}>
                        <Star size={14} /> Reviews
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1 text-burgundy" onClick={() => handleDelete(e.eventId, e.title)}>
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  )},
                ]}
                data={completedEvents}
                keyExtractor={(e: any) => e.eventId}
                emptyMessage=""
              />
            </Card>
          </div>
        )}

        {archivedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-semibold text-near-black">Archived Events</h2>
              <Badge variant="neutral">{archivedEvents.length}</Badge>
            </div>
            <Card hover={false} padding="none">
              <Table
                columns={[
                  { key: "title", header: "Event", render: (e: any) => (
                    <div>
                      <p className="font-body text-sm font-medium text-near-black">{e.title}</p>
                      <p className="font-body text-xs text-muted-gray">{e.city}</p>
                    </div>
                  )},
                  { key: "category", header: "Category", render: (e: any) => e.categoryName || "—" },
                  { key: "startDate", header: "Date", render: (e: any) => e.startDate ? formatShortDate(e.startDate) : "—" },
                  { key: "actions", header: "Actions", render: (e: any) => (
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleRestore(e.eventId)}>
                        <RotateCcw size={14} /> Restore
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1 text-burgundy" onClick={() => handleDelete(e.eventId, e.title)}>
                        <Trash2 size={14} /> Delete Permanently
                      </Button>
                    </div>
                  )},
                ]}
                data={archivedEvents}
                keyExtractor={(e: any) => e.eventId}
                emptyMessage=""
              />
            </Card>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
        )}

        <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)} title="Update Event Status" size="sm">
          <div className="space-y-4">
            <p className="font-body text-dark-gray">
              Change status for: <strong>{statusModal?.title}</strong>
            </p>
            <Select
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={EVENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setStatusModal(null)}>Cancel</Button>
              <Button onClick={handleStatusChange} isLoading={isUpdating}>Update</Button>
            </div>
          </div>
        </Modal>

        {ticketModal && (
          <TicketManagementModal
            event={ticketModal}
            onClose={() => setTicketModal(null)}
          />
        )}

        {reviewsModal && (
          <EventReviewsModal
            eventId={reviewsModal.eventId}
            eventTitle={reviewsModal.title}
            onClose={() => setReviewsModal(null)}
          />
        )}

        <Modal isOpen={!!editModal} onClose={() => { setEditModal(null); setEditEventImages([]); }} title="Edit Event" size="md">
          <div className="space-y-4">
            <Input label="Title" value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={editForm.categoryId}
                onChange={(e) => setEditForm(f => ({ ...f, categoryId: e.target.value }))}
                options={categories.map((c: any) => ({ value: c.categoryId, label: c.categoryName }))}
                placeholder="Select category"
              />
              <Input label="City" value={editForm.city} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <DateTimePicker
                label="Start Date & Time"
                value={editForm.startDate}
                onChange={(v) => setEditForm(f => ({ ...f, startDate: v }))}
              />
              <DateTimePicker
                label="End Date & Time"
                value={editForm.endDate}
                onChange={(v) => setEditForm(f => ({ ...f, endDate: v }))}
                minDate={editForm.startDate ? new Date(editForm.startDate) : undefined}
              />
            </div>
            <Input label="Max Capacity" type="number" value={editForm.maxCapacity} onChange={(e) => setEditForm(f => ({ ...f, maxCapacity: e.target.value }))} />
            <ImageUploader
              images={editEventImages}
              onChange={setEditEventImages}
              max={5}
              label="Event Photos"
              hint="First photo will be used as the cover image."
            />
            <div>
              <label className="block text-sm font-medium text-near-black mb-1.5 font-body">Description</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none"
              />
            </div>
            {editError && <p className="text-sm text-burgundy font-body">{editError}</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setEditModal(null)}>Cancel</Button>
              <Button onClick={handleEdit} isLoading={isEditing}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
