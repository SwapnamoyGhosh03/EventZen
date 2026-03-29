import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import Card from "@/components/ui/Card";
import { CHART_COLORS } from "@/config/constants";

const tooltipStyle = {
  contentStyle: {
    background: "#FFFFFF",
    border: "1px solid #E8E0D0",
    borderRadius: "8px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
  },
};

interface BarChartCardProps {
  title: string;
  data: any[];
  dataKey: string;
  xKey: string;
  color?: string;
}

export function BarChartCard({
  title,
  data,
  dataKey,
  xKey,
  color = CHART_COLORS[0],
}: BarChartCardProps) {
  return (
    <Card hover={false} padding="lg">
      <h3 className="font-heading text-lg font-semibold text-near-black mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#8A8A8A" }} />
          <YAxis tick={{ fontSize: 12, fill: "#8A8A8A" }} />
          <Tooltip {...tooltipStyle} />
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[4, 4, 0, 0]}
            animationBegin={200}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface PieChartCardProps {
  title: string;
  data: { name: string; value: number }[];
}

export function PieChartCard({ title, data }: PieChartCardProps) {
  return (
    <Card hover={false} padding="lg">
      <h3 className="font-heading text-lg font-semibold text-near-black mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            animationBegin={200}
            animationDuration={800}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend
            formatter={(value) => (
              <span className="font-body text-sm text-dark-gray">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

interface LineChartCardProps {
  title: string;
  data: any[];
  lines: { key: string; color: string; name: string }[];
  xKey: string;
}

export function LineChartCard({ title, data, lines, xKey }: LineChartCardProps) {
  return (
    <Card hover={false} padding="lg">
      <h3 className="font-heading text-lg font-semibold text-near-black mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#8A8A8A" }} />
          <YAxis tick={{ fontSize: 12, fill: "#8A8A8A" }} />
          <Tooltip {...tooltipStyle} />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              name={line.name}
              strokeWidth={2}
              dot={{ r: 3, fill: line.color }}
              animationBegin={200}
              animationDuration={800}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
