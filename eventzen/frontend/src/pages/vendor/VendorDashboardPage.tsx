import { Calendar, IndianRupee, MapPin, TrendingUp, Star } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import StatCard from "@/components/dashboard/StatCard";
import Card from "@/components/ui/Card";
import { useListEventsQuery } from "@/store/api/eventApi";
import { useListBookingsQuery } from "@/store/api/venueApi";
import { useGetReviewSummaryQuery } from "@/store/api/reviewApi";

const EMOJIS = ["", "😞", "😕", "😐", "😊", "🤩"];

function EventRatingRow({ event }: { event: any }) {
  const eventId = event.eventId || event.id;
  const { data: summary } = useGetReviewSummaryQuery(eventId, { skip: !eventId });

  const avg = summary?.averageRating ?? summary?.averageEventRating ?? summary?.average;
  const count = summary?.count ?? summary?.totalReviews ?? summary?.total ?? 0;

  if (!avg || count === 0) return null;

  const score = parseFloat(avg).toFixed(1);
  const emoji = EMOJIS[Math.round(parseFloat(avg))] || "⭐";

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-light last:border-0">
      <div>
        <p className="font-body text-sm font-medium text-near-black">{event.title}</p>
        <p className="font-body text-xs text-muted-gray">{count} review{count !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="font-heading text-lg font-bold text-amber">{score}</span>
        <span className="font-body text-xs text-muted-gray">/ 5</span>
      </div>
    </div>
  );
}

export default function VendorDashboardPage() {
  const { data: eventsData } = useListEventsQuery({ size: 100 });
  const { data: bookingsData } = useListBookingsQuery();

  const events = Array.isArray(eventsData?.content) ? eventsData.content : Array.isArray(eventsData) ? eventsData : [];
  const bookings = Array.isArray(bookingsData)
    ? bookingsData
    : Array.isArray(bookingsData?.content)
      ? bookingsData.content
      : [];

  const completedEvents = events.filter((e: any) => e.status === "COMPLETED");
  const activeEvents = events.filter((e: any) => e.status !== "ARCHIVED" && e.status !== "COMPLETED");

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            Vendor Dashboard
          </h1>
          <p className="font-body text-dark-gray">
            Overview of your event operations
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Calendar size={20} />}
            label="Total Events"
            value={events.length}
            color="bg-amber/10 text-amber"
          />
          <StatCard
            icon={<MapPin size={20} />}
            label="Bookings"
            value={bookings.length}
            color="bg-sage/10 text-sage"
          />
          <StatCard
            icon={<IndianRupee size={20} />}
            label="Revenue"
            value="₹0"
            color="bg-dusty-blue/10 text-dusty-blue"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Avg. Attendance"
            value="0%"
            color="bg-burgundy/10 text-burgundy"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Events */}
          <Card hover={false} padding="lg">
            <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
              Active Events
            </h2>
            {activeEvents.length === 0 ? (
              <p className="font-body text-muted-gray text-center py-6">
                No active events.
              </p>
            ) : (
              <div className="space-y-1">
                {activeEvents.slice(0, 5).map((event: any) => (
                  <div
                    key={event.eventId || event.id}
                    className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0"
                  >
                    <div>
                      <p className="font-body text-sm font-medium text-near-black">
                        {event.title}
                      </p>
                      <p className="font-body text-xs text-muted-gray">
                        {event.city} &bull; {event.status?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Ratings Received */}
          <Card hover={false} padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-amber fill-amber" />
              <h2 className="font-heading text-lg font-semibold text-near-black">
                Event Ratings
              </h2>
            </div>
            {completedEvents.length === 0 ? (
              <p className="font-body text-muted-gray text-center py-6">
                Ratings appear here once events are completed and reviewed.
              </p>
            ) : (
              <div>
                {completedEvents.map((event: any) => (
                  <EventRatingRow key={event.eventId || event.id} event={event} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
