import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  trend,
  color = "bg-amber/10 text-amber",
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white border border-border-light rounded-lg p-5 transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-body font-medium ${
              trend.isPositive ? "text-sage" : "text-burgundy"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="font-heading text-2xl font-bold text-near-black">{value}</p>
      <p className="font-body text-sm text-muted-gray mt-1">{label}</p>
    </motion.div>
  );
}
