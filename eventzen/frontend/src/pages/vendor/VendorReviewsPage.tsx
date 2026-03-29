import { useState } from "react";
import { Star, MessageSquare, TrendingUp, Search, Eye, EyeOff } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useListEventsQuery } from "@/store/api/eventApi";
import {
  useGetBulkSummariesQuery,
  useGetEventReviewsListQuery,
  useToggleShowcaseMutation,
} from "@/store/api/reviewApi";

const EMOJIS = ["", "😞", "😕", "😐", "😊", "🤩"];
const RATING_COLORS = ["#D4A843", "#7A1B2D", "#8BA888"];

function MiniStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-border-light rounded-xl p-3 text-center">
      <p className="font-body text-[10px] text-muted-gray mb-0.5 uppercase tracking-wide">{label}</p>
      <p className="font-heading text-lg font-bold text-near-black">{value}</p>
    </div>
  );
}

export default function VendorReviewsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const { data: eventsData, isLoading: eventsLoading } = useListEventsQuery(
    { page: 0, size: 200, organizerId: currentUserId },
    { skip: !currentUserId }
  );
  const allEvents: any[] = (
    Array.isArray(eventsData?.content)
      ? eventsData.content
      : Array.isArray(eventsData)
      ? eventsData
      : []
  ).filter((e: any) => e.organizerId === currentUserId);

  const eventIds = allEvents.map((e: any) => e.eventId || e.id).filter(Boolean);

  const { data: summariesRaw } = useGetBulkSummariesQuery(eventIds, { skip: eventIds.length === 0 });
  const summaries: any[] = Array.isArray(summariesRaw) ? summariesRaw : [];

  // Overview stats
  const totalReviews = summaries.reduce((sum, s) => sum + (s.count || 0), 0);
  const eventsReviewedCount = summaries.filter((s) => s.count > 0).length;
  const weightedAvg = (key: string) => {
    if (totalReviews === 0) return 0;
    return summaries.reduce((sum, s) => sum + (s[key] || 0) * (s.count || 0), 0) / totalReviews;
  };

  // Events with reviews, filtered by search, sorted by most reviews
  const eventsWithReviews = allEvents
    .filter((e: any) => {
      const id = e.eventId || e.id;
      const s = summaries.find((s: any) => s.eventId === id);
      return s && s.count > 0;
    })
    .filter((e: any) => !search || e.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      const sa = summaries.find((s: any) => s.eventId === (a.eventId || a.id));
      const sb = summaries.find((s: any) => s.eventId === (b.eventId || b.id));
      return (sb?.count || 0) - (sa?.count || 0);
    });

  const selectedEvent = allEvents.find((e: any) => (e.eventId || e.id) === selectedEventId);
  const selectedSummary = summaries.find((s: any) => s.eventId === selectedEventId);

  const { data: reviewsRaw, isLoading: reviewsLoading } = useGetEventReviewsListQuery(
    selectedEventId!,
    { skip: !selectedEventId }
  );
  const reviews: any[] = Array.isArray(reviewsRaw)
    ? reviewsRaw
    : Array.isArray(reviewsRaw?.content)
    ? reviewsRaw.content
    : [];

  const [toggleShowcase] = useToggleShowcaseMutation();
  const handleToggle = async (feedbackId: string, current: boolean) => {
    if (!selectedEventId) return;
    setTogglingId(feedbackId);
    try {
      await toggleShowcase({ eventId: selectedEventId, feedbackId, showcase: !current }).unwrap();
    } catch {}
    setTogglingId(null);
  };

  // Chart data
  const avgRatingsData = [
    { name: "Event Quality", value: selectedSummary?.avgEventRating ?? 0 },
    { name: "Your Service", value: selectedSummary?.avgVendorRating ?? 0 },
    { name: "EventZen Platform", value: selectedSummary?.avgPlatformRating ?? 0 },
  ];

  const distData = [1, 2, 3, 4, 5].map((star) => ({
    star: `${star}★`,
    Event: reviews.filter((r: any) => r.eventRating === star).length,
    Vendor: reviews.filter((r: any) => r.vendorRating === star).length,
    Platform: reviews.filter((r: any) => r.platformRating === star).length,
  }));

  const timelineData = [...reviews]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .reduce((acc: any[], r: any) => {
      const date = new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const last = acc[acc.length - 1];
      if (last?.date === date) last.count++;
      else acc.push({ date, count: 1 });
      return acc;
    }, []);

  const showcasedCount = reviews.filter((r: any) => r.isShowcased).length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            Reviews Analytics
          </h1>
          <p className="font-body text-dark-gray">
            Attendee feedback across your events with showcase management
          </p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: "Total Reviews",
              value: totalReviews,
              icon: <MessageSquare size={16} />,
              bg: "bg-amber/10",
              iconColor: "text-amber",
            },
            {
              label: "Avg Event Rating",
              value: totalReviews ? `${weightedAvg("avgEventRating").toFixed(1)}/5` : "—",
              icon: <Star size={16} />,
              bg: "bg-amber/10",
              iconColor: "text-amber",
            },
            {
              label: "Avg Your Rating",
              value: totalReviews ? `${weightedAvg("avgVendorRating").toFixed(1)}/5` : "—",
              icon: <Star size={16} />,
              bg: "bg-burgundy/10",
              iconColor: "text-burgundy",
            },
            {
              label: "Avg Platform Rating",
              value: totalReviews ? `${weightedAvg("avgPlatformRating").toFixed(1)}/5` : "—",
              icon: <Star size={16} />,
              bg: "bg-sage/10",
              iconColor: "text-sage",
            },
            {
              label: "Events Reviewed",
              value: eventsReviewedCount,
              icon: <TrendingUp size={16} />,
              bg: "bg-dusty-blue/10",
              iconColor: "text-dusty-blue",
            },
          ].map(({ label, value, icon, bg, iconColor }) => (
            <Card key={label} hover={false} padding="sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
                <span className={iconColor}>{icon}</span>
              </div>
              <p className="font-body text-[11px] text-muted-gray">{label}</p>
              <p className="font-heading text-xl font-bold text-near-black">{value}</p>
            </Card>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left: Event list */}
          <div className="space-y-3">
            <p className="font-accent text-[10px] uppercase tracking-widest text-muted-gray font-semibold">
              Your Reviewed Events
            </p>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search events…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-border-light rounded-lg font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber/30"
              />
            </div>
            <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-0.5">
              {eventsLoading ? (
                <p className="font-body text-sm text-muted-gray text-center py-8">Loading events…</p>
              ) : eventsWithReviews.length === 0 ? (
                <p className="font-body text-sm text-muted-gray text-center py-8">
                  {search ? "No events match your search." : "No reviewed events yet."}
                </p>
              ) : (
                eventsWithReviews.map((e: any) => {
                  const id = e.eventId || e.id;
                  const s = summaries.find((s: any) => s.eventId === id);
                  const avg = s
                    ? ((s.avgEventRating + s.avgVendorRating + s.avgPlatformRating) / 3).toFixed(1)
                    : "—";
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedEventId(id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedEventId === id
                          ? "border-amber bg-amber/5 shadow-warm-sm"
                          : "border-border-light bg-white hover:border-amber/40"
                      }`}
                    >
                      <p className="font-body text-sm font-medium text-near-black line-clamp-2 leading-snug">
                        {e.title}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-body text-xs text-muted-gray">{s?.count || 0} reviews</span>
                        <div className="flex items-center gap-0.5">
                          <Star size={10} className="text-amber fill-amber" />
                          <span className="font-body text-xs font-semibold text-amber">{avg}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Detail panel */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedEventId ? (
              <Card hover={false} padding="lg">
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-3">
                    <Star size={26} className="text-amber" />
                  </div>
                  <p className="font-heading text-base font-semibold text-near-black mb-1">
                    Select an event
                  </p>
                  <p className="font-body text-sm text-muted-gray max-w-xs mx-auto">
                    Choose one of your events to view attendee feedback, rating breakdowns, and manage which reviews appear publicly.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Event heading */}
                <div>
                  <h2 className="font-heading text-lg font-bold text-near-black leading-snug">
                    {selectedEvent?.title}
                  </h2>
                  <p className="font-body text-xs text-muted-gray mt-0.5">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""} ·{" "}
                    <span className="text-amber font-semibold">{showcasedCount}</span> showcased publicly
                  </p>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MiniStatCard label="Total Reviews" value={selectedSummary?.count ?? 0} />
                  <MiniStatCard
                    label="Event Rating"
                    value={
                      selectedSummary?.avgEventRating
                        ? `${Number(selectedSummary.avgEventRating).toFixed(1)}/5`
                        : "—"
                    }
                  />
                  <MiniStatCard
                    label="Your Rating"
                    value={
                      selectedSummary?.avgVendorRating
                        ? `${Number(selectedSummary.avgVendorRating).toFixed(1)}/5`
                        : "—"
                    }
                  />
                  <MiniStatCard
                    label="Platform Rating"
                    value={
                      selectedSummary?.avgPlatformRating
                        ? `${Number(selectedSummary.avgPlatformRating).toFixed(1)}/5`
                        : "—"
                    }
                  />
                </div>

                {/* Charts */}
                {reviews.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Average ratings comparison */}
                      <Card hover={false} padding="sm">
                        <p className="font-accent text-[10px] uppercase tracking-widest text-muted-gray mb-3">
                          Average Ratings
                        </p>
                        <ResponsiveContainer width="100%" height={148}>
                          <BarChart
                            layout="vertical"
                            data={avgRatingsData}
                            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} tickCount={6} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={88} />
                            <Tooltip
                              formatter={(v: any) => [`${Number(v).toFixed(2)} / 5`, "Avg"]}
                              contentStyle={{ fontSize: 11 }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {avgRatingsData.map((_, i) => (
                                <Cell key={i} fill={RATING_COLORS[i]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>

                      {/* Rating distribution */}
                      <Card hover={false} padding="sm">
                        <p className="font-accent text-[10px] uppercase tracking-widest text-muted-gray mb-3">
                          Rating Distribution
                        </p>
                        <ResponsiveContainer width="100%" height={148}>
                          <BarChart
                            data={distData}
                            margin={{ top: 0, right: 8, left: -16, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="star" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ fontSize: 11 }} />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="Event" fill="#D4A843" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Vendor" fill="#7A1B2D" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Platform" fill="#8BA888" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </div>

                    {/* Timeline */}
                    {timelineData.length > 1 && (
                      <Card hover={false} padding="sm">
                        <p className="font-accent text-[10px] uppercase tracking-widest text-muted-gray mb-3">
                          Submission Timeline
                        </p>
                        <ResponsiveContainer width="100%" height={110}>
                          <AreaChart
                            data={timelineData}
                            margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ fontSize: 11 }} />
                            <Area
                              type="monotone"
                              dataKey="count"
                              name="Reviews"
                              stroke="#D4A843"
                              fill="#D4A843"
                              fillOpacity={0.15}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Card>
                    )}
                  </>
                )}

                {/* Individual reviews */}
                <Card hover={false} padding="sm">
                  <p className="font-accent text-[10px] uppercase tracking-widest text-muted-gray mb-3">
                    Individual Reviews &amp; Showcase Management
                  </p>
                  {reviewsLoading ? (
                    <div className="py-6 text-center font-body text-sm text-muted-gray">
                      Loading reviews…
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="py-6 text-center font-body text-sm text-muted-gray">
                      No reviews for this event yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-0.5">
                      {reviews.map((r: any, i: number) => (
                        <div
                          key={r.feedbackId || i}
                          className={`border rounded-xl p-4 transition-all ${
                            r.isShowcased
                              ? "border-amber/40 bg-amber/5"
                              : "border-border-light bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex flex-wrap gap-4">
                                {[
                                  { label: "Event", value: r.eventRating, comment: r.eventComment },
                                  { label: "Your Service", value: r.vendorRating, comment: r.vendorComment },
                                  { label: "Platform", value: r.platformRating, comment: r.platformComment },
                                ].map(({ label, value, comment }) => (
                                  <div key={label} className="text-center min-w-[60px]">
                                    <p className="font-accent text-[9px] uppercase tracking-wider text-muted-gray mb-0.5">
                                      {label}
                                    </p>
                                    <p className="text-xl leading-none">{EMOJIS[value] || "—"}</p>
                                    <div className="flex justify-center gap-0.5 mt-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          size={8}
                                          className={
                                            s <= value
                                              ? "text-amber fill-amber"
                                              : "text-border-light fill-border-light"
                                          }
                                        />
                                      ))}
                                    </div>
                                    <p className="font-body text-[10px] font-semibold text-near-black mt-0.5">
                                      {value}/5
                                    </p>
                                    {comment && (
                                      <p className="font-body text-[10px] text-muted-gray mt-1 italic line-clamp-2">
                                        &quot;{comment}&quot;
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <p className="font-body text-[10px] text-muted-gray">
                                Submitted{" "}
                                {new Date(r.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <Button
                              variant={r.isShowcased ? "primary" : "ghost"}
                              size="sm"
                              className={`gap-1.5 shrink-0 ${
                                !r.isShowcased ? "border border-border-light" : ""
                              }`}
                              onClick={() => handleToggle(r.feedbackId, r.isShowcased)}
                              isLoading={togglingId === r.feedbackId}
                              disabled={togglingId !== null && togglingId !== r.feedbackId}
                            >
                              {r.isShowcased ? (
                                <>
                                  <Eye size={13} /> Showcased
                                </>
                              ) : (
                                <>
                                  <EyeOff size={13} /> Showcase
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
