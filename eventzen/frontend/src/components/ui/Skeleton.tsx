interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded-md h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <div
      className={`
        bg-gradient-to-r from-border-light via-cream to-border-light
        bg-[length:200%_100%] animate-shimmer
        ${variantClasses[variant]}
        ${className}
      `}
      style={{
        width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
        height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-border-light rounded-lg p-6 space-y-4">
      <Skeleton variant="rectangular" height={180} className="w-full" />
      <Skeleton width="70%" height={20} />
      <Skeleton width="50%" />
      <div className="flex gap-2">
        <Skeleton width={80} height={28} variant="rectangular" />
        <Skeleton width={60} height={28} variant="rectangular" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton width={40} height={40} variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </div>
          <Skeleton width={80} height={28} variant="rectangular" />
        </div>
      ))}
    </div>
  );
}
