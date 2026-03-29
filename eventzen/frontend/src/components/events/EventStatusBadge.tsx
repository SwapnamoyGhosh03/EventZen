import Badge from "@/components/ui/Badge";

interface EventStatusBadgeProps {
  status: string;
  /** When true, uses viewer-facing labels (Upcoming / Ongoing) instead of internal status names */
  publicView?: boolean;
}

const adminStatusMap: Record<string, { variant: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  DRAFT: { variant: "neutral", label: "Draft" },
  PUBLISHED: { variant: "info", label: "Published" },
  REGISTRATION_OPEN: { variant: "success", label: "Registration Open" },
  ONGOING: { variant: "warning", label: "Ongoing" },
  COMPLETED: { variant: "danger", label: "Completed" },
  ARCHIVED: { variant: "neutral", label: "Archived" },
};

const publicStatusMap: Record<string, { variant: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  DRAFT: { variant: "neutral", label: "Draft" },
  PUBLISHED: { variant: "info", label: "Upcoming" },
  REGISTRATION_OPEN: { variant: "warning", label: "Ongoing" },
  ONGOING: { variant: "warning", label: "Ongoing" },
  COMPLETED: { variant: "danger", label: "Completed" },
  ARCHIVED: { variant: "neutral", label: "Archived" },
};

export default function EventStatusBadge({ status, publicView = false }: EventStatusBadgeProps) {
  const map = publicView ? publicStatusMap : adminStatusMap;
  const config = map[status] || { variant: "neutral" as const, label: status };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
