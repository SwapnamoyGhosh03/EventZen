import { useState } from "react";
import { Plus, MapPin, Users, Trash2, Pencil } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import ImageUploader from "@/components/ui/ImageUploader";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useListVenuesQuery, useCreateVenueMutation, useUpdateVenueMutation, useDeleteVenueMutation } from "@/store/api/venueApi";

export default function AdminVenuesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, error } = useListVenuesQuery();
  const [createVenue, { isLoading: isCreating }] = useCreateVenueMutation();
  const [updateVenue, { isLoading: isUpdating }] = useUpdateVenueMutation();
  const [deleteVenue] = useDeleteVenueMutation();
  const [createError, setCreateError] = useState("");
  const [venueImages, setVenueImages] = useState<string[]>([]);
  const [editVenue, setEditVenue] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", street: "", city: "", state: "", capacity: "", baseRate: "", description: "" });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editError, setEditError] = useState("");

  const raw = data?.data ?? data;
  const venues = Array.isArray(raw) ? raw : raw?.content || raw?.venues || [];

  const [form, setForm] = useState({ name: "", street: "", city: "", state: "", capacity: "", baseRate: "", description: "" });

  const openEdit = (v: any) => {
    setEditVenue(v);
    setEditForm({
      name: v.name || "",
      street: v.address?.street || "",
      city: v.address?.city || "",
      state: v.address?.state || "",
      capacity: v.total_capacity != null ? String(v.total_capacity) : "",
      baseRate: v.pricing?.base_rate != null ? String(v.pricing.base_rate) : "",
      description: v.description || "",
    });
    setEditImages((v.media_gallery || []).map((m: any) => m.url));
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVenue) return;
    setEditError("");
    try {
      await updateVenue({
        id: editVenue._id || editVenue.id,
        data: {
          name: editForm.name,
          address: { street: editForm.street, city: editForm.city, state: editForm.state },
          total_capacity: editForm.capacity ? Number(editForm.capacity) : undefined,
          description: editForm.description || undefined,
          pricing: editForm.baseRate ? { base_rate: Number(editForm.baseRate), currency: "INR" } : undefined,
          media_gallery: editImages.map((url) => ({ url, type: "image" })),
        },
      }).unwrap();
      setEditVenue(null);
    } catch (err: any) {
      setEditError(err?.data?.message || "Failed to update venue");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      await createVenue({
        name: form.name,
        address: { street: form.street, city: form.city, state: form.state },
        total_capacity: Number(form.capacity),
        description: form.description || undefined,
        pricing: form.baseRate ? { base_rate: Number(form.baseRate), currency: "INR" } : undefined,
        media_gallery: venueImages.map((url) => ({ url, type: "image" })),
      }).unwrap();
      setShowCreate(false);
      setForm({ name: "", street: "", city: "", state: "", capacity: "", baseRate: "", description: "" });
      setVenueImages([]);
    } catch (err: any) {
      setCreateError(err?.data?.message || "Failed to create venue");
    }
  };

  const columns = [
    { key: "name", header: "Venue", render: (v: any) => (
      <div className="flex items-center gap-3">
        {v.media_gallery?.[0]?.url ? (
          <img
            src={v.media_gallery[0].url}
            alt={v.name}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-dusty-blue/10 flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-dusty-blue" />
          </div>
        )}
        <div>
          <p className="font-body text-sm font-medium text-near-black">{v.name}</p>
          <p className="font-body text-xs text-muted-gray">
            {v.address?.street ? `${v.address.street}, ` : ""}{v.address?.city || ""}
          </p>
        </div>
      </div>
    )},
    { key: "city", header: "City", render: (v: any) => v.address?.city || "—" },
    { key: "capacity", header: "Capacity", render: (v: any) => (
      <span className="flex items-center gap-1 font-body text-sm">
        <Users size={14} className="text-muted-gray" />{v.total_capacity ?? v.capacity ?? "—"}
      </span>
    )},
    { key: "pricing", header: "Rate", render: (v: any) => (
      <span className="font-body text-sm">{v.pricing?.base_rate ? `₹${v.pricing.base_rate.toLocaleString("en-IN")}` : "—"}</span>
    )},
    { key: "status", header: "Status", render: (v: any) => (
      <Badge variant={(v.is_active ?? v.active) !== false ? "success" : "neutral"}>
        {(v.is_active ?? v.active) !== false ? "Active" : "Inactive"}
      </Badge>
    )},
    { key: "actions", header: "", render: (v: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
          <Pencil size={16} />
        </Button>
        <Button variant="ghost" size="sm" className="text-burgundy" onClick={() => deleteVenue(v._id || v.id)}>
          <Trash2 size={16} />
        </Button>
      </div>
    )},
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black">
            Venue Administration
          </h1>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={18} /> Add Venue
          </Button>
        </div>

        {error ? (
          <Card hover={false}>
            <p className="text-burgundy font-body text-sm">Failed to load venues. Please check that the venue service is running on port 8083.</p>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
        ) : (
          <Card hover={false} padding="none">
            <Table columns={columns} data={venues} keyExtractor={(v: any) => v._id || v.id} emptyMessage="No venues registered" />
          </Card>
        )}

        <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setVenueImages([]); }} title="Add Venue" size="md">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label="Venue Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Street Address" value={form.street} onChange={(e) => setForm(f => ({ ...f, street: e.target.value }))} />
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="City" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
              <Input label="State" value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} />
              <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))} />
            </div>
            <Input label="Base Rate (₹/day)" type="number" value={form.baseRate} onChange={(e) => setForm(f => ({ ...f, baseRate: e.target.value }))} />
            <ImageUploader
              images={venueImages}
              onChange={setVenueImages}
              max={6}
              label="Venue Photos"
              hint="First photo will be shown as the cover image."
            />
            <div>
              <label className="block text-sm font-medium text-near-black mb-1.5 font-body">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none" />
            </div>
            {createError && <p className="text-sm text-burgundy font-body">{createError}</p>}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" type="button" onClick={() => { setShowCreate(false); setVenueImages([]); }}>Cancel</Button>
              <Button type="submit" isLoading={isCreating}>Create Venue</Button>
            </div>
          </form>
        </Modal>
      <Modal isOpen={!!editVenue} onClose={() => setEditVenue(null)} title="Edit Venue" size="md">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Venue Name" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Street Address" value={editForm.street} onChange={(e) => setEditForm(f => ({ ...f, street: e.target.value }))} />
          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="City" value={editForm.city} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="State" value={editForm.state} onChange={(e) => setEditForm(f => ({ ...f, state: e.target.value }))} />
            <Input label="Capacity" type="number" value={editForm.capacity} onChange={(e) => setEditForm(f => ({ ...f, capacity: e.target.value }))} />
          </div>
          <Input label="Base Rate (₹/day)" type="number" value={editForm.baseRate} onChange={(e) => setEditForm(f => ({ ...f, baseRate: e.target.value }))} />
          <ImageUploader
            images={editImages}
            onChange={setEditImages}
            max={6}
            label="Venue Photos"
            hint="First photo will be shown as the cover image."
          />
          <div>
            <label className="block text-sm font-medium text-near-black mb-1.5 font-body">Description</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-white border-[1.5px] border-warm-tan rounded-md px-4 py-3 font-body text-sm text-near-black placeholder:text-muted-gray focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(212,168,67,0.15)] transition-all resize-none" />
          </div>
          {editError && <p className="text-sm text-burgundy font-body">{editError}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setEditVenue(null)}>Cancel</Button>
            <Button type="submit" isLoading={isUpdating}>Save Changes</Button>
          </div>
        </form>
      </Modal>
      </div>
    </PageTransition>
  );
}
