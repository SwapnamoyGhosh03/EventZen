import { useState, useRef, useEffect } from "react";
import { Plus, Upload, X, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { ticketTypeSchema, type TicketTypeFormData } from "@/utils/validators";
import {
  useGetTicketTypesQuery,
  useCreateTicketTypeMutation,
  useUpdateTicketTypeMutation,
  useDeleteTicketTypeMutation,
} from "@/store/api/ticketApi";

interface TicketManagementModalProps {
  event: any;
  onClose: () => void;
}

export default function TicketManagementModal({ event, onClose }: TicketManagementModalProps) {
  const { data: ticketTypesData, isLoading } = useGetTicketTypesQuery(event.eventId);
  const [createTicketType, { isLoading: isCreating }] = useCreateTicketTypeMutation();
  const [updateTicketType, { isLoading: isUpdating }] = useUpdateTicketTypeMutation();
  const [deleteTicketType] = useDeleteTicketTypeMutation();

  const [showForm, setShowForm] = useState(false);
  const [sharedSeatMap, setSharedSeatMap] = useState("");
  const [chartInitialized, setChartInitialized] = useState(false);
  const [isSavingChart, setIsSavingChart] = useState(false);
  const [chartSaved, setChartSaved] = useState(false);
  const [createError, setCreateError] = useState("");

  // Restore saved seatmap from any existing ticket type once data loads
  useEffect(() => {
    if (chartInitialized || isLoading) return;
    const types: any[] = Array.isArray(ticketTypesData?.content)
      ? ticketTypesData.content
      : Array.isArray(ticketTypesData)
      ? ticketTypesData
      : [];
    const saved = types.find((tt) => tt.seatMapImageUrl)?.seatMapImageUrl;
    if (saved) setSharedSeatMap(saved);
    setChartInitialized(true);
  }, [ticketTypesData, isLoading, chartInitialized]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    totalQuantity: "",
    maxPerUser: "",
    description: "",
  });
  const [editError, setEditError] = useState("");

  const ticketTypes = ticketTypesData?.content || ticketTypesData || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketTypeFormData>({ resolver: zodResolver(ticketTypeSchema) as any });

  const onSubmit = async (data: TicketTypeFormData) => {
    setCreateError("");
    try {
      await createTicketType({
        eventId: event.eventId,
        data: {
          name: data.name,
          type: "GENERAL",
          price: data.price,
          currency: "INR",
          totalQuantity: data.totalQuantity,
          maxPerUser: data.maxPerUser ?? 10,
          description: data.description || "",
          saleStart: new Date().toISOString(),
          saleEnd: new Date(event.endDate || Date.now() + 86400000 * 30).toISOString(),
          seatMapImageUrl: sharedSeatMap || undefined,
        },
      }).unwrap();
      reset();
      setShowForm(false);
    } catch (err: any) {
      setCreateError(err?.data?.message || "Failed to create ticket type");
    }
  };

  const startEdit = (tt: any) => {
    setEditingId(tt.ticketTypeId);
    setEditForm({
      name: tt.name || "",
      price: String(tt.price ?? ""),
      totalQuantity: String(tt.totalQuantity ?? ""),
      maxPerUser: String(tt.maxPerUser ?? "10"),
      description: tt.description || "",
    });
    setEditError("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditError("");
    try {
      await updateTicketType({
        ticketTypeId: editingId,
        eventId: event.eventId,
        data: {
          name: editForm.name || undefined,
          price: editForm.price !== "" ? Number(editForm.price) : undefined,
          totalQuantity: editForm.totalQuantity !== "" ? Number(editForm.totalQuantity) : undefined,
          maxPerUser: editForm.maxPerUser !== "" ? Math.min(10, Math.max(1, Number(editForm.maxPerUser))) : undefined,
          description: editForm.description,
          seatMapImageUrl: sharedSeatMap || undefined,
        },
      }).unwrap();
      setEditingId(null);
    } catch (err: any) {
      setEditError(err?.data?.message || "Failed to update ticket type");
    }
  };

  const handleDelete = async (tt: any) => {
    if (!window.confirm(`Delete ticket type "${tt.name}"? This cannot be undone.`)) return;
    try {
      await deleteTicketType({
        ticketTypeId: tt.ticketTypeId,
        eventId: event.eventId,
      }).unwrap();
    } catch {
      // handled by toast
    }
  };

  const handleSaveChart = async () => {
    if (!sharedSeatMap || ticketTypes.length === 0) return;
    setIsSavingChart(true);
    setChartSaved(false);
    try {
      await Promise.all(
        ticketTypes.map((tt: any) =>
          updateTicketType({
            ticketTypeId: tt.ticketTypeId,
            eventId: event.eventId,
            data: { seatMapImageUrl: sharedSeatMap },
          }).unwrap()
        )
      );
      setChartSaved(true);
      setTimeout(() => setChartSaved(false), 3000);
    } catch { /* silent */ }
    finally { setIsSavingChart(false); }
  };

  const totalAllocated = ticketTypes.reduce((sum: number, tt: any) => sum + (tt.totalQuantity || 0), 0);
  const venueCapacity = event.maxCapacity || 0;

  return (
    <Modal isOpen onClose={onClose} title={`Tickets — ${event.title}`} size="lg">
      <div className="space-y-4">
        {/* Capacity summary bar */}
        {venueCapacity > 0 && (
          <div className="bg-cream rounded-lg px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-muted-gray uppercase tracking-wide">Venue Capacity</span>
              <span className="font-body text-sm font-semibold text-near-black">
                {totalAllocated.toLocaleString("en-IN")} / {venueCapacity.toLocaleString("en-IN")} seats allocated
              </span>
            </div>
            <div className="h-2 bg-border-light rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  totalAllocated > venueCapacity ? "bg-burgundy" : totalAllocated / venueCapacity > 0.8 ? "bg-amber" : "bg-green-500"
                }`}
                style={{ width: `${Math.min((totalAllocated / venueCapacity) * 100, 100)}%` }}
              />
            </div>
            {totalAllocated > venueCapacity && (
              <p className="font-body text-xs text-burgundy">
                Total allocated tickets exceed venue capacity by {(totalAllocated - venueCapacity).toLocaleString("en-IN")}.
              </p>
            )}
          </div>
        )}

        {/* Shared seating / pricing chart */}
        <SeatMapUploader value={sharedSeatMap} onChange={(v) => { setSharedSeatMap(v); setChartSaved(false); }} />
        {sharedSeatMap && (
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleSaveChart}
              isLoading={isSavingChart}
              disabled={ticketTypes.length === 0}
            >
              Save Chart to All Tiers
            </Button>
            {ticketTypes.length === 0 && (
              <span className="font-body text-xs text-muted-gray">
                Chart will be attached when you create a ticket type below.
              </span>
            )}
            {chartSaved && (
              <span className="font-body text-xs text-green-600">
                Chart saved to all ticket tiers.
              </span>
            )}
          </div>
        )}

        {/* Existing ticket types */}
        {isLoading ? (
          <p className="font-body text-sm text-muted-gray text-center py-4">Loading...</p>
        ) : ticketTypes.length > 0 ? (
          <div className="space-y-2">
            <p className="font-body text-xs text-muted-gray uppercase tracking-wide">Ticket Types</p>
            {ticketTypes.map((tt: any) => (
              <div key={tt.ticketTypeId || tt.id}>
                {editingId === tt.ticketTypeId ? (
                  /* Inline edit form */
                  <div className="p-3 bg-amber/5 rounded-lg border-2 border-amber space-y-3">
                    <p className="font-body text-xs font-medium text-amber uppercase tracking-wide">Editing</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-near-black mb-1 font-body">Name</label>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full bg-white border border-warm-tan rounded px-3 py-2 font-body text-sm focus:outline-none focus:border-amber"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-near-black mb-1 font-body">Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.price}
                          onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                          className="w-full bg-white border border-warm-tan rounded px-3 py-2 font-body text-sm focus:outline-none focus:border-amber"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-near-black mb-1 font-body">Total Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.totalQuantity}
                          onChange={(e) => setEditForm((f) => ({ ...f, totalQuantity: e.target.value }))}
                          className="w-full bg-white border border-warm-tan rounded px-3 py-2 font-body text-sm focus:outline-none focus:border-amber"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-near-black mb-1 font-body">Max per Person <span className="text-muted-gray font-normal">(1–10)</span></label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editForm.maxPerUser}
                          onChange={(e) => setEditForm((f) => ({ ...f, maxPerUser: e.target.value }))}
                          className="w-full bg-white border border-warm-tan rounded px-3 py-2 font-body text-sm focus:outline-none focus:border-amber"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-near-black mb-1 font-body">Description</label>
                      <textarea
                        rows={2}
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        className="w-full bg-white border border-warm-tan rounded px-3 py-2 font-body text-sm focus:outline-none focus:border-amber resize-none"
                      />
                    </div>
                    {editError && <p className="text-sm text-burgundy font-body">{editError}</p>}
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button size="sm" isLoading={isUpdating} onClick={saveEdit}>Save Changes</Button>
                    </div>
                  </div>
                ) : (
                  /* View row */
                  <div className="flex items-start gap-3 p-3 bg-cream rounded-lg border border-border-light">
                    {tt.seatMapImageUrl && (
                      <img
                        src={tt.seatMapImageUrl}
                        alt="Seat map"
                        className="w-14 h-14 rounded object-cover border border-border-light flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-body text-sm font-medium text-near-black">{tt.name}</p>
                        <Badge variant={tt.price === 0 ? "success" : "warning"}>
                          {tt.price === 0 ? "Free" : `₹${Number(tt.price).toLocaleString("en-IN")}`}
                        </Badge>
                      </div>
                      {tt.description && (
                        <p className="font-body text-xs text-muted-gray mt-0.5 truncate">{tt.description}</p>
                      )}
                      <p className="font-body text-xs text-muted-gray mt-0.5">
                        {tt.availableQuantity ?? tt.totalQuantity} / {tt.totalQuantity} available &middot; max {tt.maxPerUser ?? 10}/person
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(tt)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-amber/10 text-muted-gray hover:text-amber transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(tt)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-burgundy/10 text-muted-gray hover:text-burgundy transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-muted-gray text-center py-4">No ticket types yet. Add your first tier below.</p>
        )}

        {/* Add ticket type form */}
        {showForm ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t border-border-light pt-4">
            <p className="font-body text-sm font-medium text-near-black">New Ticket Type</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Name" placeholder="e.g. VIP, General, Early Bird" error={errors.name?.message} {...register("name")} />
              <Input label="Price (₹)" type="number" placeholder="0 for free" error={errors.price?.message} {...register("price")} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Total Quantity" type="number" placeholder="How many tickets in this tier" error={errors.totalQuantity?.message} {...register("totalQuantity")} />
              <Input label="Max per Person (1–10)" type="number" placeholder="10" error={errors.maxPerUser?.message} {...register("maxPerUser")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-near-black mb-1.5 font-body">Description (optional)</label>
              <textarea
                {...register("description")}
                rows={2}
                placeholder="What's included, seat section, perks, etc."
                className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none"
              />
            </div>
            {createError && <p className="text-sm text-burgundy font-body">{createError}</p>}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); reset(); }}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isCreating}>Add Ticket Type</Button>
            </div>
          </form>
        ) : (
          <div className="border-t border-border-light pt-4">
            <Button variant="secondary" className="gap-2 w-full" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add Ticket Type
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Single image uploader for seat map ──────────────────────────────────────

function SeatMapUploader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 1000;
        let { width, height } = img;
        if (width > maxW) { height = Math.round(height * maxW / width); width = maxW; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-near-black font-body">
        Seating / Pricing Chart
        <span className="text-muted-gray font-normal ml-1">(shared across all ticket tiers — optional)</span>
      </label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Seat map" className="max-h-40 rounded-lg border border-border-light object-contain" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 w-6 h-6 bg-burgundy text-white rounded-full flex items-center justify-center"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-warm-tan hover:border-amber rounded-lg font-body text-sm text-muted-gray hover:text-amber transition-colors"
        >
          <Upload size={16} />
          Upload seating chart or pricing diagram
        </button>
      )}
      <p className="font-body text-xs text-muted-gray">
        Upload one diagram showing all tiers together (e.g. a seating plan or pricing table). It will be shown to customers across all ticket types.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />
    </div>
  );
}
