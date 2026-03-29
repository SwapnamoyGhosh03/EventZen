export const API_BASE_URLS = {
  AUTH: import.meta.env.VITE_AUTH_API_URL || "http://localhost:8081/api/v1",
  EVENT: import.meta.env.VITE_EVENT_API_URL || "http://localhost:8082/api/v1",
  VENUE: import.meta.env.VITE_VENUE_API_URL || "http://localhost:8083/api/v1",
  TICKET: import.meta.env.VITE_TICKET_API_URL || "http://localhost:8084/api/v1",
  PAYMENT: import.meta.env.VITE_PAYMENT_API_URL || "http://localhost:8085/api/v1",
  NOTIFICATION: import.meta.env.VITE_NOTIFICATION_API_URL || "http://localhost:8086/api/v1",
} as const;

export const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || "http://localhost:8083/api/v1/upload";

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 12,
  SIZES: [6, 12, 24, 48],
} as const;

export const EVENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "REGISTRATION_OPEN",
  "ONGOING",
  "COMPLETED",
  "ARCHIVED",
] as const;

export const EVENT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#8A8A8A",
  PUBLISHED: "#7B9EB8",
  REGISTRATION_OPEN: "#8BA888",
  ONGOING: "#D4A843",
  COMPLETED: "#7A1B2D",
  ARCHIVED: "#4A4A4A",
};

export const ROLES = {
  ADMIN: "ADMIN",
  ORGANIZER: "ORGANIZER",
  VENDOR: "VENDOR",
  ATTENDEE: "ATTENDEE",
  CUSTOMER: "CUSTOMER",
} as const;

export const PORTAL_ROUTES: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  ORGANIZER: "/vendor/dashboard",
  VENDOR: "/vendor/dashboard",
  ATTENDEE: "/customer/dashboard",
  CUSTOMER: "/customer/dashboard",
};

export const CHART_COLORS = [
  "#D4A843",
  "#7A1B2D",
  "#8BA888",
  "#E85B8A",
  "#7B9EB8",
  "#A0522D",
];
