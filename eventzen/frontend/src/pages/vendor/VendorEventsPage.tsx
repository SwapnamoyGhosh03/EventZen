import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Plus, Users, Ticket, Pencil, ListMusic, Trash2, PlusCircle, Archive, RotateCcw, AlertTriangle, FlagOff, Star } from "lucide-react";
import RatingDisplay from "@/components/reviews/RatingDisplay";
import EventReviewsModal from "@/components/reviews/EventReviewsModal";
import PageTransition from "@/components/layout/PageTransition";
import EventFilters from "@/components/events/EventFilters";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import EventStatusBadge from "@/components/events/EventStatusBadge";
import ImageUploader from "@/components/ui/ImageUploader";
import TicketManagementModal from "@/components/tickets/TicketManagementModal";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventFormData } from "@/utils/validators";
import {
  useListEventsQuery, useCreateEventMutation, useUpdateEventMutation,
  useUpdateEventStatusMutation,
  useGetCategoriesQuery, useGetAgendaQuery, useAddSessionMutation,
  useUpdateSessionMutation, useDeleteSessionMutation,
} from "@/store/api/eventApi";
import { useListVenuesQuery } from "@/store/api/venueApi";
import type { RootState } from "@/store/store";

// ── Agenda Builder ──────────────────────────────────────────────────────────

const SESSION_TYPES = ["KEYNOTE", "PANEL", "WORKSHOP", "BREAKOUT", "LIGHTNING", "NETWORKING", "PRESENTATION", "Q&A"];

const emptySession = () => ({
  _localId: Math.random().toString(36).slice(2),
  sessionId: "",
  title: "",
  sessionType: "KEYNOTE",
  speakerName: "",
  speakerRole: "",
  speakerCompany: "",
  speakerPhotoUrl: "",
  speakerProfileLink: "",
  location: "",
  capacity: "",
  startTime: "",
  endTime: "",
  description: "",
});

type SessionDraft = ReturnType<typeof emptySession>;

function AgendaBuilderModal({ event, onClose }: { event: any; onClose: () => void }) {
  const eventId = event.eventId || event.id;
  const { data: agendaData, isLoading } = useGetAgendaQuery(eventId);
  const [addSession, { isLoading: isAdding }] = useAddSessionMutation();
  const [updateSession, { isLoading: isUpdating }] = useUpdateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();

  const existingSessions: any[] = Array.isArray(agendaData)
    ? agendaData
    : Array.isArray(agendaData?.sessions)
    ? agendaData.sessions
    : Array.isArray(agendaData?.agendaItems)
    ? agendaData.agendaItems
    : Array.isArray(agendaData?.items)
    ? agendaData.items
    : [];

  const sortedExistingSessions = [...existingSessions].sort((a, b) => {
    const sortA = Number(a?.sortOrder);
    const sortB = Number(b?.sortOrder);
    const hasSortA = Number.isFinite(sortA);
    const hasSortB = Number.isFinite(sortB);

    if (hasSortA && hasSortB && sortA !== sortB) return sortA - sortB;
    if (hasSortA && !hasSortB) return -1;
    if (!hasSortA && hasSortB) return 1;

    const startA = a?.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER;
    const startB = b?.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER;
    return startA - startB;
  });

  const [drafts, setDrafts] = useState<SessionDraft[]>([]);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading || drafts.length > 0) return;

    // Only create a blank draft if there are no saved sessions.
    if (sortedExistingSessions.length === 0) {
      setDrafts([emptySession()]);
    }
  }, [isLoading, drafts.length, sortedExistingSessions.length]);

  const updateDraft = (localId: string, field: string, value: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d._localId === localId ? { ...d, [field]: value } : d))
    );
  };

  const removeDraft = (localId: string) => {
    setDrafts((prev) => prev.filter((d) => d._localId !== localId));
  };

  const handleDeleteExisting = async (sessionId: string) => {
    try {
      await deleteSession({ eventId, sessionId }).unwrap();
    } catch {}
  };

  const handleSave = async () => {
    setSaveError("");
    setSaving(true);
    try {
      for (const draft of drafts) {
        if (!draft.title || !draft.startTime || !draft.endTime) continue;
        const payload = {
          title: draft.title,
          sessionType: draft.sessionType,
          speakerName: draft.speakerName || undefined,
          speakerRole: draft.speakerRole || undefined,
          speakerCompany: draft.speakerCompany || undefined,
          speakerPhotoUrl: draft.speakerPhotoUrl || undefined,
          speakerProfileLink: draft.speakerProfileLink || undefined,
          location: draft.location || undefined,
          capacity: draft.capacity ? Number(draft.capacity) : undefined,
          startTime: draft.startTime,
          endTime: draft.endTime,
          description: draft.description || undefined,
          speaker: draft.speakerName || undefined,
        };
        if (draft.sessionId) {
          await updateSession({ eventId, sessionId: draft.sessionId, data: payload }).unwrap();
        } else {
          await addSession({ eventId, data: payload }).unwrap();
        }
      }
      onClose();
    } catch (err: any) {
      setSaveError(err?.data?.message || "Failed to save sessions");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full bg-white border-[1.5px] border-warm-tan rounded-md px-3 py-2 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all";

  return (
    <Modal isOpen onClose={onClose} title="" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-xs text-amber uppercase tracking-widest">Speaker Details And Session Builder</p>
            <p className="font-body text-xs text-muted-gray mt-0.5">
              Event: <strong className="text-near-black">{event.title}</strong>
            </p>
          </div>
          <button
            onClick={() => setDrafts((prev) => [...prev, emptySession()])}
            className="flex items-center gap-1.5 text-xs font-body text-amber hover:text-amber/80 transition-colors"
          >
            <PlusCircle size={15} /> Add Session
          </button>
        </div>

        {isLoading && (
          <p className="font-body text-xs text-muted-gray">Loading existing sessions...</p>
        )}

        {/* Existing sessions (read-only overview + delete) */}
        {!isLoading && sortedExistingSessions.length > 0 && (
          <div>
            <p className="font-body text-xs font-semibold text-near-black mb-2">
              Existing Sessions ({sortedExistingSessions.length})
            </p>
            <div className="space-y-2">
              {sortedExistingSessions.map((s: any, idx: number) => (
                <div
                  key={s.id || s.sessionId}
                  className="flex items-center justify-between p-3 bg-cream rounded-lg border border-border-light"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-near-black">Session {idx + 1}: {s.title}</p>
                    <p className="font-body text-xs text-muted-gray">
                      {s.sessionType || s.type || "—"} · {s.location || s.room || "—"} ·{" "}
                      {s.startTime
                        ? new Date(s.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteExisting(s.id || s.sessionId)}
                    className="p-1.5 text-muted-gray hover:text-burgundy transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="my-4 border-t border-border-light" />
            <p className="font-body text-xs font-semibold text-near-black mb-2">Add New Sessions</p>
          </div>
        )}

        {/* Draft sessions */}
        <div className="space-y-6">
          {drafts.map((draft, idx) => (
            <div key={draft._localId} className="border border-border-light rounded-xl p-4 relative">
              <div className="flex items-center justify-between mb-4">
                <p className="font-body text-sm font-semibold text-near-black">
                  Session {sortedExistingSessions.length + idx + 1}
                  {sortedExistingSessions.length > 0 && (
                    <span className="ml-1 text-xs text-muted-gray font-normal">(new)</span>
                  )}
                </p>
                {drafts.length > 1 && (
                  <button
                    onClick={() => removeDraft(draft._localId)}
                    className="text-xs font-body text-burgundy hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">
                    Session Title <span className="text-burgundy">*</span>
                  </label>
                  <input
                    value={draft.title}
                    onChange={(e) => updateDraft(draft._localId, "title", e.target.value)}
                    placeholder="e.g. Opening Keynote: Agentic Systems"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Session Type</label>
                  <select
                    value={draft.sessionType}
                    onChange={(e) => updateDraft(draft._localId, "sessionType", e.target.value)}
                    className={fieldClass}
                  >
                    {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Speaker Name</label>
                  <input
                    value={draft.speakerName}
                    onChange={(e) => updateDraft(draft._localId, "speakerName", e.target.value)}
                    placeholder="e.g. Dr. Meera Sethi"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Speaker Role / Title</label>
                  <input
                    value={draft.speakerRole}
                    onChange={(e) => updateDraft(draft._localId, "speakerRole", e.target.value)}
                    placeholder="Role / Title"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Speaker Company / Organization</label>
                  <input
                    value={draft.speakerCompany}
                    onChange={(e) => updateDraft(draft._localId, "speakerCompany", e.target.value)}
                    placeholder="Company / Organization"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Speaker Photo URL</label>
                  <input
                    value={draft.speakerPhotoUrl}
                    onChange={(e) => updateDraft(draft._localId, "speakerPhotoUrl", e.target.value)}
                    placeholder="Speaker photo URL"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Speaker ID / Profile Link</label>
                  <input
                    value={draft.speakerProfileLink}
                    onChange={(e) => updateDraft(draft._localId, "speakerProfileLink", e.target.value)}
                    placeholder="Speaker ID or profile link"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Room / Hall</label>
                  <input
                    value={draft.location}
                    onChange={(e) => updateDraft(draft._localId, "location", e.target.value)}
                    placeholder="e.g. Aurora Ballroom"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Session Capacity</label>
                  <input
                    type="number"
                    value={draft.capacity}
                    onChange={(e) => updateDraft(draft._localId, "capacity", e.target.value)}
                    placeholder="e.g. 900"
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-1">
                  <DateTimePicker
                    label={<>Session Start Time <span className="text-burgundy">*</span></>}
                    value={draft.startTime}
                    onChange={(v) => updateDraft(draft._localId, "startTime", v)}
                    minDate={event.startDate ? new Date(event.startDate) : undefined}
                    maxDate={event.endDate ? new Date(event.endDate) : undefined}
                  />
                </div>
                <div>
                  <DateTimePicker
                    label={<>Session End Time <span className="text-burgundy">*</span></>}
                    value={draft.endTime}
                    onChange={(v) => updateDraft(draft._localId, "endTime", v)}
                    minDate={draft.startTime ? new Date(draft.startTime) : event.startDate ? new Date(event.startDate) : undefined}
                    maxDate={event.endDate ? new Date(event.endDate) : undefined}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-near-black mb-1 font-body">Session Description</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => updateDraft(draft._localId, "description", e.target.value)}
                    placeholder="Brief description of this session..."
                    rows={2}
                    className={`${fieldClass} resize-none`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="font-body text-xs text-muted-gray bg-cream rounded-lg px-4 py-3 border border-border-light">
          Editing updates the live event agenda and sessions. Existing ticket tiers remain read-only until their update endpoints are active.
        </p>

        {saveError && <p className="text-sm text-burgundy font-body">{saveError}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} isLoading={saving || isAdding || isUpdating}>
            Update Event
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function VendorEventsPage() {
  const navigate = useNavigate();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [ticketModal, setTicketModal] = useState<any>(null);
  const [agendaModal, setAgendaModal] = useState<any>(null);
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", city: "", startDate: "", endDate: "", maxCapacity: "", categoryId: "", venueId: "" });
  const [editEventImages, setEditEventImages] = useState<string[]>([]);
  const [editError, setEditError] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState<any>(null);
  const [deleteRequestModal, setDeleteRequestModal] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteRequestSent, setDeleteRequestSent] = useState(false);
  const [reviewsModal, setReviewsModal] = useState<{ eventId: string; title: string } | null>(null);

  const { data, isLoading } = useListEventsQuery(
    { page: page - 1, size: 12, ...filters, organizerId: currentUserId },
    { skip: !currentUserId }
  );
  const { data: archivedData } = useListEventsQuery(
    { page: 0, size: 100, status: "ARCHIVED", organizerId: currentUserId },
    { skip: !currentUserId }
  );
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isEditing }] = useUpdateEventMutation();
  const [updateStatus, { isLoading: isArchiving }] = useUpdateEventStatusMutation();

  const openEdit = (e: any) => {
    if (!currentUserId || e.organizerId !== currentUserId) {
      setEditError("You can only edit your own events");
      return;
    }
    setEditModal(e);
    setEditForm({
      title: e.title || "",
      description: e.description || "",
      city: e.city || "",
      startDate: e.startDate ? e.startDate.slice(0, 16) : "",
      endDate: e.endDate ? e.endDate.slice(0, 16) : "",
      maxCapacity: e.maxCapacity != null ? String(e.maxCapacity) : "",
      categoryId: e.categoryId || "",
      venueId: e.venueId || "",
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
    if (!currentUserId || editModal.organizerId !== currentUserId) {
      setEditError("You can only edit your own events");
      return;
    }
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
          venueId: editForm.venueId || undefined,
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
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: venuesData } = useListVenuesQuery();

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const categoryOptions = categories.length > 0
    ? categories.map((c: any) => ({ value: c.categoryId, label: c.categoryName }))
    : [
        { value: "Technology", label: "Technology" },
        { value: "Music", label: "Music" },
        { value: "Business", label: "Business" },
        { value: "Art", label: "Art" },
        { value: "Sports", label: "Sports" },
        { value: "Food", label: "Food & Drink" },
      ];

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({ resolver: zodResolver(eventSchema) as any });

  const watchedCapacity = watch("maxAttendees");

  const venuesRaw = venuesData?.data ?? venuesData;
  const adminVenues = Array.isArray(venuesRaw) ? venuesRaw : venuesRaw?.venues || [];
  const filteredVenues = watchedCapacity > 0
    ? adminVenues.filter((v: any) => (v.total_capacity ?? v.capacity ?? 0) >= watchedCapacity)
    : adminVenues;

  const [venueMode, setVenueMode] = useState<"admin" | "own">("admin");
  const [ownVenueAddress, setOwnVenueAddress] = useState("");
  const [ownVenueCapacity, setOwnVenueCapacity] = useState("");
  const [ownVenueImages, setOwnVenueImages] = useState<string[]>([]);

  const [eventImages, setEventImages] = useState<string[]>([]);
  const [createError, setCreateError] = useState("");

  const eventsRaw = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
  const events = currentUserId
    ? eventsRaw.filter((e: any) => e.organizerId === currentUserId)
    : [];
  const totalPages = data?.meta?.totalPages || 1;

  const activeEvents = events.filter((e: any) => e.status !== "ARCHIVED" && e.status !== "COMPLETED");
  const completedEvents = events.filter((e: any) => e.status === "COMPLETED");
  const archivedRaw = Array.isArray(archivedData?.content) ? archivedData.content : Array.isArray(archivedData) ? archivedData : [];
  const archivedEvents = currentUserId ? archivedRaw.filter((e: any) => e.organizerId === currentUserId) : [];

  const handleArchive = async (event: any) => {
    try {
      await updateStatus({ id: event.eventId, status: "ARCHIVED" }).unwrap();
      setArchiveConfirm(null);
    } catch {}
  };

  const handleRestore = async (eventId: string) => {
    try { await updateStatus({ id: eventId, status: "DRAFT" }).unwrap(); } catch {}
  };

  const handleDeleteRequest = async () => {
    if (!deleteRequestModal) return;
    try {
      await updateStatus({ id: deleteRequestModal.eventId, status: "ARCHIVED" }).unwrap();
      setDeleteRequestSent(true);
      setTimeout(() => { setDeleteRequestModal(null); setDeleteReason(""); setDeleteRequestSent(false); }, 2500);
    } catch {}
  };

  const onSubmit = async (formData: EventFormData) => {
    setCreateError("");
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.category || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        city: formData.city,
        maxCapacity: venueMode === "own" && ownVenueCapacity !== ""
          ? Number(ownVenueCapacity)
          : formData.maxAttendees,
        imageUrls: eventImages.length > 0 ? eventImages : undefined,
        bannerUrl: eventImages.length > 0 ? eventImages[0] : undefined,
      };
      if (venueMode === "admin" && formData.venueId) {
        payload.venueId = formData.venueId;
      } else if (venueMode === "own") {
        payload.address = ownVenueAddress;
        if (ownVenueImages.length > 0 || eventImages.length > 0) {
          const combined = [...eventImages, ...ownVenueImages];
          payload.imageUrls = combined;
          payload.bannerUrl = combined[0];
        }
      }
      await createEvent(payload).unwrap();
      setShowCreate(false);
      reset();
      setEventImages([]);
      setOwnVenueAddress("");
      setOwnVenueCapacity("");
      setOwnVenueImages([]);
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error || err?.error || "Failed to create event";
      const status = err?.status ? ` (${err.status})` : "";
      setCreateError(`${msg}${status}`);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
              Events
            </h1>
            <p className="font-body text-dark-gray">
              Manage and create your events. New events require admin approval before publishing.
            </p>
          </div>
          <Button onClick={() => setShowDisclosure(true)} className="gap-2">
            <Plus size={18} />
            New Event
          </Button>
        </div>

        <EventFilters onFilter={(f) => { setFilters(f); setPage(1); }} />

        {/* Active Events Table */}
        <Card hover={false} padding="none">
          <Table
            columns={[
              { key: "title", header: "Event", render: (e: any) => (
                <div className="flex items-center gap-2">
                  {(e.imageUrls?.[0] || e.bannerUrl) && (
                    <img src={e.imageUrls?.[0] || e.bannerUrl} alt={e.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-body text-sm font-medium text-near-black">{e.title}</p>
                    <p className="font-body text-xs text-muted-gray">{e.city}</p>
                  </div>
                </div>
              )},
              { key: "startDate", header: "Date", render: (e: any) => (
                <span className="font-body text-sm text-dark-gray">
                  {e.startDate ? new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </span>
              )},
              { key: "capacity", header: "Capacity", render: (e: any) => (
                <span className="font-body text-sm text-dark-gray">{e.maxCapacity || "—"}</span>
              )},
              { key: "status", header: "Status", render: (e: any) => <EventStatusBadge status={e.status} /> },
              { key: "actions", header: "Actions", render: (e: any) => {
                const isOwner = !!currentUserId && e.organizerId === currentUserId;
                return (
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(e)} disabled={!isOwner}><Pencil size={14} /> Edit</Button>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => setAgendaModal(e)} disabled={!isOwner}><ListMusic size={14} /> Agenda</Button>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => setTicketModal(e)} disabled={!isOwner}><Ticket size={14} /> Tickets</Button>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(`/vendor/events/${e.eventId}/registrations`)} disabled={!isOwner}><Users size={14} /> Registrations</Button>
                    {(e.status === "ONGOING" || e.status === "REGISTRATION_OPEN") && (
                      <Button variant="ghost" size="sm" className="gap-1 text-sage" onClick={async () => { try { await updateStatus({ id: e.eventId, status: "COMPLETED" }).unwrap(); } catch {} }} disabled={!isOwner}><FlagOff size={14} /> Request Closure</Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1 text-amber" onClick={() => setArchiveConfirm(e)} disabled={!isOwner}><Archive size={14} /> Archive</Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-burgundy" onClick={() => { setDeleteRequestModal(e); setDeleteReason(""); setDeleteRequestSent(false); }} disabled={!isOwner}><Trash2 size={14} /> Request Deletion</Button>
                  </div>
                );
              }},
            ]}
            data={activeEvents}
            keyExtractor={(e: any) => e.eventId || e.id}
            emptyMessage="No active events. Create your first event to get started."
          />
        </Card>

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
        )}

        {/* Completed Events */}
        {completedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-semibold text-near-black">Completed Events</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs bg-sage/10 text-sage">{completedEvents.length}</span>
            </div>
            <Card hover={false} padding="none">
              <Table
                columns={[
                  { key: "title", header: "Event", render: (e: any) => (
                    <div className="flex items-center gap-2">
                      {(e.imageUrls?.[0] || e.bannerUrl) && (
                        <img src={e.imageUrls?.[0] || e.bannerUrl} alt={e.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-body text-sm font-medium text-near-black">{e.title}</p>
                        <p className="font-body text-xs text-muted-gray">{e.city}</p>
                      </div>
                    </div>
                  )},
                  { key: "startDate", header: "Date", render: (e: any) => (
                    <span className="font-body text-sm text-dark-gray">
                      {e.startDate ? new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                  )},
                  { key: "rating", header: "Rating", render: (e: any) => (
                    <RatingDisplay eventId={e.eventId || e.id} />
                  )},
                  { key: "status", header: "Status", render: () => (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sage/10 text-sage font-body text-xs font-semibold">
                      <Star size={11} className="fill-sage" /> Completed
                    </span>
                  )},
                  { key: "actions", header: "", render: (e: any) => (
                    <Button variant="ghost" size="sm" className="gap-1 text-amber" onClick={() => setReviewsModal({ eventId: e.eventId || e.id, title: e.title })}>
                      <Star size={14} /> Manage Reviews
                    </Button>
                  )},
                ]}
                data={completedEvents}
                keyExtractor={(e: any) => e.eventId || e.id}
                emptyMessage=""
              />
            </Card>
          </div>
        )}

        {/* Archived Events */}
        {archivedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-semibold text-near-black">Archived Events</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs bg-border-light text-muted-gray">{archivedEvents.length}</span>
            </div>
            <Card hover={false} padding="none">
              <Table
                columns={[
                  { key: "title", header: "Event", render: (e: any) => (
                    <div className="flex items-center gap-2 opacity-70">
                      {(e.imageUrls?.[0] || e.bannerUrl) && (
                        <img src={e.imageUrls?.[0] || e.bannerUrl} alt={e.title} className="w-8 h-8 rounded object-cover flex-shrink-0 grayscale" />
                      )}
                      <div>
                        <p className="font-body text-sm font-medium text-near-black">{e.title}</p>
                        <p className="font-body text-xs text-muted-gray">{e.city}</p>
                      </div>
                    </div>
                  )},
                  { key: "startDate", header: "Date", render: (e: any) => (
                    <span className="font-body text-sm text-muted-gray">
                      {e.startDate ? new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                  )},
                  { key: "status", header: "Status", render: (e: any) => <EventStatusBadge status={e.status} /> },
                  { key: "actions", header: "Actions", render: (e: any) => (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleRestore(e.eventId)}>
                      <RotateCcw size={14} /> Restore to Draft
                    </Button>
                  )},
                ]}
                data={archivedEvents}
                keyExtractor={(e: any) => e.eventId || e.id}
                emptyMessage=""
              />
            </Card>
          </div>
        )}

        {/* EventZen Platform Charges Disclosure */}
        <Modal isOpen={showDisclosure} onClose={() => setShowDisclosure(false)} title="EventZen Platform Charges" size="sm">
          <div className="space-y-5">
            <p className="font-body text-sm text-dark-gray">
              Before creating your event, please review the platform charges that EventZen deducts automatically from your earnings.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-sage/5 border border-sage/20 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-sage/15 flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xs font-bold text-sage">%</span>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-near-black">Ticket Sales Commission — 20%</p>
                  <p className="font-body text-xs text-dark-gray">20% of all gross ticket sales revenue is collected by EventZen as platform commission.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-amber/5 border border-amber/20 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-amber/15 flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xs font-bold text-amber">₹</span>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-near-black">Event Organisation Fee — ₹25,000</p>
                  <p className="font-body text-xs text-dark-gray">A flat ₹25,000 fee is charged per event organised on the EventZen platform.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-dusty-blue/5 border border-dusty-blue/20 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-dusty-blue/15 flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xs font-bold text-dusty-blue">25%</span>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-near-black">Venue Booking Commission — 25%</p>
                  <p className="font-body text-xs text-dark-gray">If you book an EventZen-managed venue, 25% of the venue budget is retained as a venue commission.</p>
                </div>
              </div>
            </div>
            <p className="font-body text-xs text-muted-gray">These charges are automatically tracked in your Finance Dashboard under Admin Revenue.</p>
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowDisclosure(false)}>Cancel</Button>
              <Button onClick={() => { setShowDisclosure(false); setShowCreate(true); }}>
                I Understand — Continue
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Event Modal */}
        <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setEventImages([]); setOwnVenueImages([]); setOwnVenueCapacity(""); }} title="Create Event" size="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                error={errors.category?.message}
                options={categoryOptions}
                placeholder="Select category"
                {...register("category")}
              />
              <Input label="City" error={errors.city?.message} {...register("city")} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="Start Date & Time"
                    value={field.value || ""}
                    onChange={field.onChange}
                    error={errors.startDate?.message}
                  />
                )}
              />
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    label="End Date & Time"
                    value={field.value || ""}
                    onChange={field.onChange}
                    error={errors.endDate?.message}
                    minDate={watch("startDate") ? new Date(watch("startDate")) : undefined}
                  />
                )}
              />
            </div>
            <Input label="Max Attendees" type="number" error={errors.maxAttendees?.message} {...register("maxAttendees")} />

            {/* Event Images */}
            <ImageUploader
              images={eventImages}
              onChange={setEventImages}
              max={5}
              label="Event Photos"
              hint="First photo will be the cover image shown in listings. Max 5 photos."
            />

            {/* Venue Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-near-black font-body">Venue</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVenueMode("admin")}
                  className={`flex-1 p-3 rounded-lg border-2 text-left transition-all font-body text-sm ${venueMode === "admin" ? "border-amber bg-amber/5" : "border-border-light hover:border-warm-tan"}`}
                >
                  <p className="font-medium text-near-black">Choose from Available Venues</p>
                  <p className="text-xs text-muted-gray mt-0.5">Select an admin-provided venue (pricing applies)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setVenueMode("own")}
                  className={`flex-1 p-3 rounded-lg border-2 text-left transition-all font-body text-sm ${venueMode === "own" ? "border-amber bg-amber/5" : "border-border-light hover:border-warm-tan"}`}
                >
                  <p className="font-medium text-near-black">Use Own Venue</p>
                  <p className="text-xs text-muted-gray mt-0.5">Enter your own venue details</p>
                </button>
              </div>
              {venueMode === "admin" ? (
                <div>
                  {filteredVenues.length > 0 ? (
                    <Select
                      label="Select Venue"
                      options={filteredVenues.map((v: any) => ({
                        value: v._id || v.id,
                        label: `${v.name} — ${v.address?.city || ""} (cap. ${v.total_capacity ?? v.capacity ?? "?"}${v.pricing?.base_rate ? ` · ₹${v.pricing.base_rate.toLocaleString("en-IN")}` : ""})`,
                      }))}
                      placeholder="Choose a venue"
                      {...register("venueId")}
                    />
                  ) : (
                    <p className="text-sm text-burgundy font-body mt-1">
                      {watchedCapacity > 0
                        ? `No venue found with capacity ≥ ${watchedCapacity}. Try a lower capacity or use your own venue.`
                        : "No venues available. Ask admin to add venues."}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Venue Address"
                    placeholder="Enter venue name and address"
                    value={ownVenueAddress}
                    onChange={(e) => setOwnVenueAddress(e.target.value)}
                  />
                  <Input
                    label="Venue Total Capacity"
                    type="number"
                    placeholder="Maximum seats / standing capacity of your venue"
                    value={ownVenueCapacity}
                    onChange={(e) => setOwnVenueCapacity(e.target.value)}
                    hint="This overrides the Max Attendees field above and will be shown in ticket management."
                  />
                  <ImageUploader
                    images={ownVenueImages}
                    onChange={setOwnVenueImages}
                    max={4}
                    label="Venue Photos"
                    hint="Upload photos of your venue. First photo becomes the event cover."
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-near-black mb-1.5 font-body">Description</label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none"
              />
              {errors.description && <p className="mt-1 text-sm text-burgundy">{errors.description.message}</p>}
            </div>
            {createError && <p className="text-sm text-burgundy font-body">{createError}</p>}
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setEventImages([]); setOwnVenueImages([]); setOwnVenueCapacity(""); }}>Cancel</Button>
              <Button type="submit" isLoading={isCreating}>Create Event</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Event Modal */}
        <Modal
          isOpen={!!editModal}
          onClose={() => {
            setEditModal(null);
            setEditEventImages([]);
          }}
          title="Edit Event"
          size="md"
        >
          <div className="space-y-4">
            <Input label="Title" value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={editForm.categoryId}
                onChange={(e) => setEditForm(f => ({ ...f, categoryId: e.target.value }))}
                options={categoryOptions}
                placeholder="Select category"
              />
              <Input label="City" value={editForm.city} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <Select
              label="Venue (EventZen)"
              value={editForm.venueId}
              onChange={(e) => setEditForm(f => ({ ...f, venueId: e.target.value }))}
              options={[
                { value: "", label: "No venue / use own venue" },
                ...adminVenues.map((v: any) => ({
                  value: v._id || v.id,
                  label: `${v.name}${v.address?.city ? ` — ${v.address.city}` : ""}${v.pricing?.base_rate ? ` (₹${v.pricing.base_rate.toLocaleString("en-IN")})` : ""}`,
                })),
              ]}
              placeholder="Select venue"
            />
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
            <Input label="Max Attendees" type="number" value={editForm.maxCapacity} onChange={(e) => setEditForm(f => ({ ...f, maxCapacity: e.target.value }))} />
            <ImageUploader
              images={editEventImages}
              onChange={setEditEventImages}
              max={5}
              label="Event Photos"
              hint="First photo is used as cover image."
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

        {/* Ticket Management Modal */}
        {ticketModal && (
          <TicketManagementModal
            event={ticketModal}
            onClose={() => setTicketModal(null)}
          />
        )}
      </div>

      {/* Agenda Builder Modal */}
      {agendaModal && (
        <AgendaBuilderModal
          event={agendaModal}
          onClose={() => setAgendaModal(null)}
        />
      )}

      {/* Reviews Modal */}
      {reviewsModal && (
        <EventReviewsModal
          eventId={reviewsModal.eventId}
          eventTitle={reviewsModal.title}
          onClose={() => setReviewsModal(null)}
        />
      )}

      {/* Archive confirmation modal */}
      <Modal isOpen={!!archiveConfirm} onClose={() => setArchiveConfirm(null)} title="Archive Event" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber/10 rounded-lg border border-amber/20">
            <Archive size={18} className="text-amber flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-medium text-near-black">{archiveConfirm?.title}</p>
              <p className="font-body text-xs text-dark-gray mt-1">
                Archiving will hide this event from public listings. You can restore it from the Archived Events section below.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setArchiveConfirm(null)}>Cancel</Button>
            <Button className="gap-2" onClick={() => handleArchive(archiveConfirm)} isLoading={isArchiving}>
              <Archive size={15} /> Archive Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete request modal */}
      <Modal isOpen={!!deleteRequestModal} onClose={() => { setDeleteRequestModal(null); setDeleteReason(""); setDeleteRequestSent(false); }} title="Request Event Deletion" size="sm">
        <div className="space-y-4">
          {deleteRequestSent ? (
            <div className="p-4 bg-sage/10 rounded-lg border border-sage/20 text-center">
              <p className="font-body text-sm font-medium text-sage">Request submitted.</p>
              <p className="font-body text-xs text-dark-gray mt-1">The event has been archived and flagged for admin review.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 bg-burgundy/5 rounded-lg border border-burgundy/20">
                <AlertTriangle size={18} className="text-burgundy flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-sm font-medium text-near-black">{deleteRequestModal?.title}</p>
                  <p className="font-body text-xs text-dark-gray mt-1">
                    Vendors cannot directly delete events. This will archive the event and notify the admin to permanently delete it.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-near-black mb-1 font-body">Reason for deletion <span className="text-burgundy">*</span></label>
                <textarea
                  rows={3}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Briefly explain why this event should be deleted..."
                  className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-3 py-2 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setDeleteRequestModal(null)}>Cancel</Button>
                <Button className="gap-2 bg-burgundy hover:bg-burgundy/90" onClick={handleDeleteRequest} isLoading={isArchiving} disabled={!deleteReason.trim()}>
                  <Trash2 size={15} /> Submit Request
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </PageTransition>
  );
}

