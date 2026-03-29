import { Star } from "lucide-react";
import { useGetReviewSummaryQuery } from "@/store/api/reviewApi";

interface RatingDisplayProps {
  eventId: string;
  compact?: boolean;
}

function StarBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= Math.round(score);
        return (
          <Star
            key={i}
            size={12}
            className={filled ? "text-amber fill-amber" : "text-border-light fill-border-light"}
          />
        );
      })}
    </div>
  );
}

export default function RatingDisplay({ eventId, compact = false }: RatingDisplayProps) {
  const { data: summary, isLoading } = useGetReviewSummaryQuery(eventId, {
    skip: !eventId,
  });

  if (isLoading || !summary) return null;

  const avg =
    summary.averageRating ??
    summary.averageEventRating ??
    summary.average ??
    null;

  const count = summary.count ?? summary.totalReviews ?? summary.total ?? 0;

  if (!avg || count === 0) return null;

  const score = parseFloat(avg).toFixed(1);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 font-body text-xs text-muted-gray">
        <Star size={11} className="text-amber fill-amber" />
        <span className="font-semibold text-near-black">{score}</span>
        <span>({count})</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarBar score={parseFloat(avg)} />
      <span className="font-body text-xs text-dark-gray">
        <span className="font-semibold">{score}</span>
        <span className="text-muted-gray"> ({count} review{count !== 1 ? "s" : ""})</span>
      </span>
    </div>
  );
}
