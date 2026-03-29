import {
  Ticket, CreditCard, Calendar, CalendarX, AlertTriangle,
  CheckCircle, Bell, Handshake, XCircle, Clock, UserCheck,
} from "lucide-react";

/** Map Kafka topic/type to a Lucide icon component */
export function getNotificationIcon(type: string) {
  if (type.startsWith("ticket") || type.startsWith("registration")) return Ticket;
  if (type.startsWith("payment")) return CreditCard;
  if (type === "event.cancelled") return CalendarX;
  if (type.startsWith("event")) return Calendar;
  if (type.startsWith("budget")) return AlertTriangle;
  if (type === "vendor.contract.signed") return Handshake;
  if (type === "checkin.milestone") return UserCheck;
  if (type === "waitlist.promoted") return CheckCircle;
  return Bell;
}

/** Map Kafka topic/type to a Tailwind bg+text color string */
export function getNotificationAccent(type: string): string {
  if (type === "payment.failed" || type === "registration.cancelled" || type === "event.cancelled")
    return "bg-burgundy/10 text-burgundy";
  if (type.startsWith("payment") || type.startsWith("ticket") || type.startsWith("registration"))
    return "bg-sage/10 text-sage";
  if (type.startsWith("budget"))
    return "bg-amber/10 text-amber";
  if (type.startsWith("event"))
    return "bg-dusty-blue/10 text-dusty-blue";
  return "bg-muted-gray/10 text-muted-gray";
}

/** Human-readable label for a notification type */
export function getNotificationTypeLabel(type: string): string {
  const map: Record<string, string> = {
    "registration.confirmed": "Ticket Booked",
    "ticket.purchased": "Ticket Issued",
    "registration.cancelled": "Registration Cancelled",
    "payment.received": "Payment",
    "payment.failed": "Payment Failed",
    "event.created": "Event Created",
    "event.updated": "Event Updated",
    "event.status.changed": "Status Changed",
    "event.deleted": "Event Deleted",
    "event.published": "Event Published",
    "event.cancelled": "Event Cancelled",
    "event.reminder.24h": "Event Reminder",
    "event.reminder.1h": "Starting Soon",
    "budget.alert.threshold": "Budget Alert",
    "vendor.contract.signed": "Contract",
    "checkin.milestone": "Check-in",
    "waitlist.promoted": "Waitlist",
    "user.registered": "Welcome",
    "user.password.reset": "Security",
  };
  return map[type] || "Notification";
}

/** Returns true if this notification type should offer a PDF download */
export function hasPdfAttachment(type: string): boolean {
  return type === "registration.confirmed" || type === "ticket.purchased" || type === "payment.received";
}
