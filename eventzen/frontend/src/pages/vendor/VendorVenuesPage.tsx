import { useState } from "react";
import { MapPin, Users, IndianRupee } from "lucide-react";
import { motion } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useListVenuesQuery, useBookVenueMutation } from "@/store/api/venueApi";
import { useAutoVenueExpenseMutation } from "@/store/api/paymentApi";
import DateTimePicker from "@/components/ui/DateTimePicker";

export default function VendorVenuesPage() {
  const { data, isLoading } = useListVenuesQuery();
  const [bookVenue] = useBookVenueMutation();
  const [autoVenueExpense] = useAutoVenueExpenseMutation();
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [bookStart, setBookStart] = useState("");
  const [bookEnd, setBookEnd] = useState("");
  const [bookEventId, setBookEventId] = useState("");
  const [bookError, setBookError] = useState("");
  const [bookSuccess, setBookSuccess] = useState(false);

  const raw = data?.data ?? data;
  const venues = Array.isArray(raw) ? raw : raw?.venues || [];

  const handleBook = async () => {
    if (!selectedVenue || !bookStart || !bookEnd || !bookEventId) return;
    setBookError("");
    try {
      const booking = await bookVenue({
        venueId: selectedVenue._id || selectedVenue.id,
        data: {
          event_id: bookEventId,
          booking_start: new Date(bookStart).toISOString(),
          booking_end: new Date(bookEnd).toISOString(),
        },
      }).unwrap();
      // Auto-add venue cost to event expenses (silently ignore if no budget exists yet)
      const bookingId = booking?.booking_id || booking?.bookingId;
      const totalCost = booking?.total_cost ?? booking?.totalCost;
      if (bookingId && totalCost > 0) {
        autoVenueExpense({ eventId: bookEventId, bookingId, amount: totalCost, currency: "INR" })
          .catch(() => {});
      }
      setBookSuccess(true);
      setTimeout(() => setBookSuccess(false), 5000);
      setSelectedVenue(null);
      setBookStart("");
      setBookEnd("");
      setBookEventId("");
    } catch (err: any) {
      setBookError(err?.data?.message || "Failed to book venue");
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            Venues
          </h1>
          <p className="font-body text-dark-gray">
            Browse and book venues for your events
          </p>
        </div>

        {bookSuccess && (
          <div className="flex items-start gap-3 bg-sage/10 border border-sage/30 rounded-xl px-4 py-3">
            <MapPin size={15} className="text-sage flex-shrink-0 mt-0.5" />
            <p className="font-body text-sm text-near-black">
              <span className="font-semibold">Venue booked successfully.</span> The venue cost has been automatically recorded as an expense in your event's finance dashboard.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : venues.length === 0 ? (
          <EmptyState
            icon={<MapPin size={28} />}
            title="No Venues Available"
            description="Venues will appear here when added."
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {venues.map((venue: any, i: number) => (
              <motion.div
                key={venue.id || venue._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } },
                }}
              >
                <Card padding="none" className="overflow-hidden">
                  <div className="h-40 bg-gradient-to-br from-dusty-blue/20 to-sage/20 flex items-center justify-center overflow-hidden">
                    {venue.media_gallery?.[0]?.url ? (
                      <img
                        src={venue.media_gallery[0].url}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin size={40} className="text-dusty-blue/40" />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-lg font-semibold text-near-black mb-2">
                      {venue.name}
                    </h3>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-muted-gray">
                        <MapPin size={14} />
                        <span className="font-body text-sm">
                          {venue.address?.city || venue.city || "—"}
                          {venue.address?.state ? `, ${venue.address.state}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-gray">
                        <Users size={14} />
                        <span className="font-body text-sm">Capacity: {venue.total_capacity ?? venue.capacity ?? "—"}</span>
                      </div>
                      {venue.pricing?.base_rate != null && (
                        <div className="flex items-center gap-2 text-amber">
                          <IndianRupee size={14} />
                          <span className="font-body text-sm font-semibold">
                            ₹{Number(venue.pricing.base_rate).toLocaleString("en-IN")}
                            <span className="text-muted-gray font-normal text-xs ml-1">base rate</span>
                          </span>
                        </div>
                      )}
                    </div>
                    <Button fullWidth size="sm" onClick={() => setSelectedVenue(venue)}>
                      Book Venue
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        <Modal
          isOpen={!!selectedVenue}
          onClose={() => setSelectedVenue(null)}
          title={`Book ${selectedVenue?.name || "Venue"}`}
          size="sm"
        >
          <div className="space-y-4">
            {selectedVenue?.pricing?.base_rate != null && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber/5 border border-amber/20 rounded-lg">
                <IndianRupee size={13} className="text-amber flex-shrink-0" />
                <p className="font-body text-xs text-dark-gray">
                  Base rate: <span className="font-semibold text-amber">₹{Number(selectedVenue.pricing.base_rate).toLocaleString("en-IN")}</span>.
                  Final cost is calculated from booking duration and will be added to your event expenses automatically.
                </p>
              </div>
            )}
            <Input
              label="Event ID"
              placeholder="Enter your event ID"
              value={bookEventId}
              onChange={(e) => setBookEventId(e.target.value)}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <DateTimePicker
                label="Start Date & Time"
                value={bookStart}
                onChange={setBookStart}
              />
              <DateTimePicker
                label="End Date & Time"
                value={bookEnd}
                onChange={setBookEnd}
              />
            </div>
            {bookError && <p className="text-sm text-burgundy font-body">{bookError}</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setSelectedVenue(null)}>Cancel</Button>
              <Button onClick={handleBook}>Confirm Booking</Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
