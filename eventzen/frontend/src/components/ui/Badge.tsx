type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-sage text-white",
  warning: "bg-amber text-white",
  danger: "bg-burgundy text-white",
  info: "bg-dusty-blue text-white",
  neutral: "bg-border-light text-dark-gray",
};

export default function Badge({
  variant = "neutral",
  children,
  className = "",
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-3.5 py-1 rounded-full
        font-body text-xs font-semibold tracking-wide
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}
