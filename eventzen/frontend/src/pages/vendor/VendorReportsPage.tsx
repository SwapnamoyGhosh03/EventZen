import { useMemo } from "react";
import { useSelector } from "react-redux";
import PageTransition from "@/components/layout/PageTransition";
import Card from "@/components/ui/Card";
import { useListEventsQuery } from "@/store/api/eventApi";
import type { RootState } from "@/store/store";
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

const monthLabel = (value: string) => {
  const d = new Date(`${value}-01T00:00:00`);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

export default function VendorReportsPage() {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const { data } = useListEventsQuery(
    { size: 500, organizerId: currentUserId },
    { skip: !currentUserId }
  );

  const allEvents = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
  const events = currentUserId
    ? allEvents.filter((e: any) => e.organizerId === currentUserId)
    : [];

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e: any) => {
      const key = (e.status || "UNKNOWN").replace(/_/g, " ");
      counts[key] = (counts[key] || 0) + 1;
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
      .slice(0, 6);
  }, [events]);

  const monthlyTrendData = useMemo(() => {
    const buckets: Record<string, { month: string; events: number; capacity: number }> = {};

    events.forEach((e: any) => {
      if (!e.startDate) return;
      const dt = new Date(e.startDate);
      if (Number.isNaN(dt.getTime())) return;

      const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (!buckets[monthKey]) {
        buckets[monthKey] = { month: monthKey, events: 0, capacity: 0 };
      }

      buckets[monthKey].events += 1;
      buckets[monthKey].capacity += Number(e.maxCapacity || 0);
    });

    const sorted = Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month));
    return sorted.slice(-12).map((item) => ({
      ...item,
      monthLabel: monthLabel(item.month),
    }));
  }, [events]);

  const timelineMixData = useMemo(() => {
    const now = Date.now();
    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;

    events.forEach((e: any) => {
      const start = e.startDate ? new Date(e.startDate).getTime() : null;
      const end = e.endDate ? new Date(e.endDate).getTime() : null;
      if (start && start > now) {
        upcoming += 1;
        return;
      }
      if (start && end && start <= now && end >= now) {
        ongoing += 1;
        return;
      }
      completed += 1;
    });

    return [{ bucket: "Lifecycle", upcoming, ongoing, completed }];
  }, [events]);

  const hasData = events.length > 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-near-black mb-1">
            Vendor Reports Dashboard
          </h1>
          <p className="font-body text-dark-gray">
            Graph-first analytics across your managed events
          </p>
        </div>

        {!hasData && (
          <Card hover={false} padding="lg">
            <p className="font-body text-muted-gray text-center py-8">
              No event data available yet. Create events to unlock report visualizations.
            </p>
          </Card>
        )}

        {hasData && (
          <>
            <div className="grid lg:grid-cols-2 gap-4">
              <Card hover={false} padding="lg">
                <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                  Event Status Split
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
                  Events vs Capacity by Month
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyTrendData}>
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

            <div className="grid lg:grid-cols-2 gap-4">
              <Card hover={false} padding="lg">
                <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                  Top Cities by Event Count
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
                  Category Distribution
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

            <Card hover={false} padding="lg">
              <h2 className="font-heading text-lg font-semibold text-near-black mb-4">
                Event Lifecycle Mix
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timelineMixData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: "#8A8A8A" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#8A8A8A" }} allowDecimals={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend />
                  <Bar dataKey="upcoming" stackId="life" fill="#7B9EB8" name="Upcoming" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="ongoing" stackId="life" fill="#D4A843" name="Ongoing" />
                  <Bar dataKey="completed" stackId="life" fill="#8BA888" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}
