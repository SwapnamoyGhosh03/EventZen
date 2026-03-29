import { useMemo } from "react";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import { useListEventsQuery } from "@/store/api/eventApi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = ["#D4A843", "#7A1B2D", "#8BA888", "#7B9EB8", "#E85B8A", "#A0522D"];

const chartTooltipStyle = {
  contentStyle: {
    background: "#FFFFFF",
    border: "1px solid #E8E0D0",
    borderRadius: "10px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "12px",
  },
};

const toMonthKey = (dateValue: string) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const toMonthLabel = (value: string) => {
  const d = new Date(`${value}-01T00:00:00`);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

export default function AdminReportsPage() {
  const { data } = useListEventsQuery({ size: 1000 });
  const events = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data) ? data : [];

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e: any) => {
      const status = (e.status || "UNKNOWN").replace(/_/g, " ");
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e: any) => {
      const city = e.city || "Unknown";
      counts[city] = (counts[city] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([city, total]) => ({ city, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [events]);

  const organizerData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e: any) => {
      const organizer = e.organizerName || e.organizerId || "Unknown Organizer";
      counts[organizer] = (counts[organizer] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([organizer, eventsCount]) => ({ organizer, eventsCount }))
      .sort((a, b) => b.eventsCount - a.eventsCount)
      .slice(0, 8);
  }, [events]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e: any) => {
      const key = e.categoryName || e.categoryId || "Uncategorized";
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [events]);

  const monthlyTrend = useMemo(() => {
    const buckets: Record<string, {
      month: string;
      total: number;
      draft: number;
      active: number;
      completed: number;
    }> = {};

    events.forEach((e: any) => {
      if (!e.startDate) return;
      const month = toMonthKey(e.startDate);
      if (!month) return;

      if (!buckets[month]) {
        buckets[month] = { month, total: 0, draft: 0, active: 0, completed: 0 };
      }

      buckets[month].total += 1;

      if (e.status === "DRAFT") buckets[month].draft += 1;
      if (e.status === "PUBLISHED" || e.status === "REGISTRATION_OPEN" || e.status === "ONGOING") buckets[month].active += 1;
      if (e.status === "COMPLETED") buckets[month].completed += 1;
    });

    return Object.values(buckets)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map((item) => ({ ...item, monthLabel: toMonthLabel(item.month) }));
  }, [events]);

  const capacityData = useMemo(() => {
    const byMonth: Record<string, { month: string; events: number; capacity: number }> = {};
    events.forEach((e: any) => {
      if (!e.startDate) return;
      const month = toMonthKey(e.startDate);
      if (!month) return;

      if (!byMonth[month]) {
        byMonth[month] = { month, events: 0, capacity: 0 };
      }

      byMonth[month].events += 1;
      byMonth[month].capacity += Number(e.maxCapacity || 0);
    });

    return Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map((item) => ({ ...item, monthLabel: toMonthLabel(item.month) }));
  }, [events]);

  const hasData = events.length > 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            Admin Reports Dashboard
          </h1>
          <p className="font-body text-dark-gray">
            Platform data visualized through graphs only
          </p>
        </div>

        {!hasData && (
          <Card hover={false} padding="lg">
            <p className="font-body text-muted-gray text-center py-8">
              No platform event data available yet.
            </p>
          </Card>
        )}

        {hasData && (
          <>
            <div className="grid lg:grid-cols-2 gap-4">
              <Card hover={false} padding="lg">
                <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                  Event Status Distribution
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {statusData.map((_, i) => (
                        <Cell key={`status-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card hover={false} padding="lg">
                <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                  Monthly Event Lifecycle Trend
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: "#8A8A8A" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#8A8A8A" }} allowDecimals={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#D4A843" strokeWidth={2.5} name="Total" />
                    <Line type="monotone" dataKey="active" stroke="#7B9EB8" strokeWidth={2.5} name="Active" />
                    <Line type="monotone" dataKey="completed" stroke="#8BA888" strokeWidth={2.5} name="Completed" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card hover={false} padding="lg">
                <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                  Events by Organizer
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={organizerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
                    <XAxis dataKey="organizer" tick={{ fontSize: 11, fill: "#8A8A8A" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#8A8A8A" }} allowDecimals={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="eventsCount" fill="#7A1B2D" radius={[6, 6, 0, 0]} name="Events" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card hover={false} padding="lg">
                <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                  Category Share
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={105}
                      paddingAngle={3}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={`category-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card hover={false} padding="lg">
                <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                  Top Cities by Events
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={cityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
                    <XAxis dataKey="city" tick={{ fontSize: 12, fill: "#8A8A8A" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#8A8A8A" }} allowDecimals={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="total" fill="#8BA888" radius={[6, 6, 0, 0]} name="Events" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card hover={false} padding="lg">
                <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                  Capacity vs Events by Month
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={capacityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: "#8A8A8A" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#8A8A8A" }} />
                    <Tooltip {...chartTooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="events" stroke="#D4A843" strokeWidth={2.5} name="Events" />
                    <Line type="monotone" dataKey="capacity" stroke="#7B9EB8" strokeWidth={2.5} name="Capacity" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
