interface ProgressProps {
  value: number;
  max?: number;
  variant?: "linear" | "circular";
  size?: "sm" | "md" | "lg";
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export default function Progress({
  value,
  max = 100,
  variant = "linear",
  size = "md",
  color = "bg-amber",
  showLabel = false,
  className = "",
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  if (variant === "circular") {
    const circleSize = size === "sm" ? 40 : size === "md" ? 56 : 72;
    const strokeWidth = size === "sm" ? 3 : 4;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
      >
        <svg width={circleSize} height={circleSize} className="-rotate-90">
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            className="stroke-border-light"
          />
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            className="stroke-amber transition-all duration-500"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        {showLabel && (
          <span className="absolute font-body text-xs font-semibold text-near-black">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={className}>
      <div
        className={`w-full bg-border-light rounded-full overflow-hidden ${heightClasses[size]}`}
      >
        <div
          className={`${color} ${heightClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-body text-muted-gray mt-1 block text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
