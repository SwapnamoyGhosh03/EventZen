import { useState } from "react";
import { Package, Star, Phone, Mail, IndianRupee, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useListVendorsQuery, useHireVendorMutation } from "@/store/api/venueApi";
import { useListEventsQuery } from "@/store/api/eventApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  CATERING: "Catering",
  AV: "Audio/Visual",
  DECOR: "Decor",
  SECURITY: "Security",
  PHOTOGRAPHY: "Photography",
  ENTERTAINMENT: "Entertainment",
  LOGISTICS: "Logistics",
  OTHER: "Other",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  CATERING: "bg-amber/10 text-amber",
  AV: "bg-dusty-blue/10 text-dusty-blue",
  DECOR: "bg-sage/10 text-sage",
  SECURITY: "bg-burgundy/10 text-burgundy",
  PHOTOGRAPHY: "bg-amber/10 text-amber-dark",
  ENTERTAINMENT: "bg-purple-100 text-purple-700",
  LOGISTICS: "bg-gray-100 text-gray-600",
  OTHER: "bg-border-light text-muted-gray",
};

function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <Star size={13} className="text-amber fill-amber" />
      <span className="font-body text-sm font-semibold text-near-black">{Number(value).toFixed(1)}</span>
      <span className="font-body text-xs text-muted-gray">({count})</span>
    </div>
  );
}

function VendorCard({ vendor, onHire }: { vendor: any; onHire: (v: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const packages: any[] = vendor.service_packages || [];

  return (
    <Card padding="none" className="overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 pb-3 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-amber" />
          </div>
          <span className={`text-[11px] font-accent font-semibold px-2 py-0.5 rounded-full ${SERVICE_TYPE_COLORS[vendor.service_type] || SERVICE_TYPE_COLORS.OTHER}`}>
            {SERVICE_TYPE_LABELS[vendor.service_type] || vendor.service_type}
          </span>
        </div>

        <h3 className="font-heading text-base font-semibold text-near-black mt-2 mb-1">
          {vendor.name}
        </h3>

        {vendor.description && (
          <p className="font-body text-sm text-muted-gray leading-relaxed mb-3 line-clamp-2">
            {vendor.description}
          </p>
        )}

        {vendor.rating_count > 0 && (
          <StarRating value={vendor.rating_average} count={vendor.rating_count} />
        )}

        {/* Contact */}
        <div className="mt-3 space-y-1">
          {vendor.contact?.email && (
            <div className="flex items-center gap-1.5 text-muted-gray">
              <Mail size={12} />
              <span className="font-body text-xs truncate">{vendor.contact.email}</span>
            </div>
          )}
          {vendor.contact?.phone && (
            <div className="flex items-center gap-1.5 text-muted-gray">
              <Phone size={12} />
              <span className="font-body text-xs">{vendor.contact.phone}</span>
            </div>
          )}
        </div>

        {/* Packages toggle */}
        {packages.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="mt-3 flex items-center gap-1 font-body text-xs text-amber hover:text-amber-dark transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? "Hide packages" : `${packages.length} package${packages.length !== 1 ? "s" : ""}`}
          </button>
        )}

        {expanded && packages.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {packages.map((pkg: any) => (
              <div key={pkg.package_id} className="px-3 py-2 bg-cream rounded-lg border border-border-light">
                <div className="flex items-center justify-between">
                  <p className="font-body text-xs font-semibold text-near-black">{pkg.name}</p>
                  <div className="flex items-center gap-0.5 text-amber">
                    <IndianRupee size={11} />
                    <span className="font-body text-xs font-semibold">
                      {Number(pkg.price).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                {pkg.description && (
                  <p className="font-body text-[11px] text-muted-gray mt-0.5">{pkg.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 pt-2 border-t border-border-light">
        <Button fullWidth size="sm" onClick={() => onHire(vendor)}>
          Hire for Event
        </Button>
      </div>
    </Card>
  );
}

const SERVICE_TYPE_OPTIONS = [
  { value: "", label: "All Service Types" },
  ...Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

export default function VendorServicesPage() {
  const { data, isLoading } = useListVendorsQuery();
  const [hireVendor, { isLoading: isHiring }] = useHireVendorMutation();
  const [filterType, setFilterType] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [hireSuccess, setHireSuccess] = useState(false);
  const [hireError, setHireError] = useState("");

  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const { data: eventsData } = useListEventsQuery(
    { size: 50, organizerId: currentUserId },
    { skip: !currentUserId }
  );

  const raw = data?.data ?? data;
  const vendors: any[] = Array.isArray(raw) ? raw : raw?.vendors || [];

  const filtered = filterType ? vendors.filter((v) => v.service_type === filterType) : vendors;

  const events = Array.isArray(eventsData?.content)
    ? eventsData.content
    : Array.isArray(eventsData)
    ? eventsData
    : [];
  const eventOptions = [
    { value: "", label: "Select an event…" },
    ...events.map((e: any) => ({ value: e.eventId || e.id, label: e.title })),
  ];

  async function handleHire() {
    if (!selectedVendor || !selectedEventId) return;
    setHireError("");
    try {
      await hireVendor({
        eventId: selectedEventId,
        data: { vendor_id: selectedVendor.vendor_id || selectedVendor._id },
      }).unwrap();
      setHireSuccess(true);
      setSelectedVendor(null);
      setSelectedEventId("");
      setTimeout(() => setHireSuccess(false), 5000);
    } catch (err: any) {
      setHireError(err?.data?.message || "Failed to hire vendor. Please try again.");
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
              Service Vendors
            </h1>
            <p className="font-body text-dark-gray">
              Browse and hire vendors for catering, AV, decor, photography, and more
            </p>
          </div>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={SERVICE_TYPE_OPTIONS}
            className="min-w-[180px]"
          />
        </div>

        {hireSuccess && (
          <div className="flex items-center gap-3 bg-sage/10 border border-sage/30 rounded-xl px-4 py-3">
            <Package size={15} className="text-sage flex-shrink-0" />
            <p className="font-body text-sm text-near-black">
              <span className="font-semibold">Vendor hired successfully.</span> They've been added to your event.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title={filterType ? `No ${SERVICE_TYPE_LABELS[filterType]} vendors` : "No Vendors Available"}
            description={filterType ? "Try a different service type." : "Service vendors will appear here once added by an admin."}
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((vendor: any, i: number) => (
              <motion.div
                key={vendor.vendor_id || vendor._id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } } }}
              >
                <VendorCard vendor={vendor} onHire={setSelectedVendor} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Modal
        isOpen={!!selectedVendor}
        onClose={() => { setSelectedVendor(null); setHireError(""); setSelectedEventId(""); }}
        title={`Hire ${selectedVendor?.name || "Vendor"}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="font-body text-sm text-dark-gray">
            Select one of your events to associate this vendor with.
          </p>
          <Select
            label="Event"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            options={eventOptions}
          />
          {hireError && <p className="font-body text-sm text-burgundy">{hireError}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setSelectedVendor(null)}>Cancel</Button>
            <Button onClick={handleHire} isLoading={isHiring} disabled={!selectedEventId}>
              Confirm Hire
            </Button>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
