db = db.getSiblingDB("eventzen_ticketing");

db.ticket_types.createIndex({ eventId: 1 });
db.ticket_types.createIndex({ eventId: 1, type: 1 });
db.ticket_types.createIndex({ ticketTypeId: 1 }, { unique: true });

db.registrations.createIndex({ registrationId: 1 }, { unique: true });
db.registrations.createIndex({ idempotencyKey: 1 }, { unique: true });
db.registrations.createIndex({ eventId: 1, attendeeId: 1 });
db.registrations.createIndex({ attendeeId: 1 });
db.registrations.createIndex({ ticketTypeId: 1 });

db.tickets.createIndex({ ticketId: 1 }, { unique: true });
db.tickets.createIndex({ eventId: 1 });
db.tickets.createIndex({ attendeeId: 1 });
db.tickets.createIndex({ registrationId: 1 });

db.checkin_logs.createIndex({ eventId: 1 });
db.checkin_logs.createIndex({ registrationId: 1 });
db.checkin_logs.createIndex({ checkinTime: 1 }, { expireAfterSeconds: 63072000 });

db.waitlists.createIndex({ eventId: 1, position: 1 });
db.waitlists.createIndex({ eventId: 1, attendeeId: 1 }, { unique: true });

db.feedbacks.createIndex({ feedbackId: 1 }, { unique: true });
db.feedbacks.createIndex({ eventId: 1, attendeeId: 1 });
db.feedbacks.createIndex({ eventId: 1, isShowcased: 1 });

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const ORGANIZER_ID = "22222222-2222-2222-2222-222222222222";
const ATTENDEE_ID = "33333333-3333-3333-3333-333333333333";

const EVENT_OPEN_ID = "8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1001";
const EVENT_UPCOMING_ID = "8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1002";
const EVENT_COMPLETED_ID = "8fd1e3b0-3d44-4cb1-8dd2-cf5a6f5d1003";

const now = new Date();

const ticketTypes = [
  {
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100001",
    eventId: EVENT_OPEN_ID,
    name: "Summit Pass - General",
    type: "GENERAL",
    price: 2499,
    currency: "INR",
    totalQuantity: 300,
    availableQuantity: 298,
    maxPerUser: 5,
    saleStart: new Date("2025-12-01T00:00:00Z"),
    saleEnd: new Date("2027-03-20T15:00:00Z"),
    description: "Full-day access, keynote sessions, and networking mixer.",
    seatMapImageUrl: "https://picsum.photos/seed/eventzen-seatmap-open/1200/800",
    organizerId: ORGANIZER_ID,
    isActive: true,
  },
  {
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100002",
    eventId: EVENT_OPEN_ID,
    name: "Summit Pass - VIP",
    type: "VIP",
    price: 4999,
    currency: "INR",
    totalQuantity: 80,
    availableQuantity: 80,
    maxPerUser: 2,
    saleStart: new Date("2025-12-01T00:00:00Z"),
    saleEnd: new Date("2027-03-20T12:00:00Z"),
    description: "Priority seating, VIP lounge, and speaker meet-and-greet.",
    seatMapImageUrl: "https://picsum.photos/seed/eventzen-seatmap-vip/1200/800",
    organizerId: ORGANIZER_ID,
    isActive: true,
  },
  {
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100003",
    eventId: EVENT_UPCOMING_ID,
    name: "Workshop Pass - Early Access",
    type: "GENERAL",
    price: 1499,
    currency: "INR",
    totalQuantity: 180,
    availableQuantity: 180,
    maxPerUser: 3,
    saleStart: new Date("2027-03-10T00:00:00Z"),
    saleEnd: new Date("2027-04-09T18:00:00Z"),
    description: "Two-day DesignOps and UX systems workshop access.",
    seatMapImageUrl: "https://picsum.photos/seed/eventzen-seatmap-workshop/1200/800",
    organizerId: ORGANIZER_ID,
    isActive: true,
  },
  {
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100004",
    eventId: EVENT_COMPLETED_ID,
    name: "Forum Pass - General",
    type: "GENERAL",
    price: 999,
    currency: "INR",
    totalQuantity: 220,
    availableQuantity: 218,
    maxPerUser: 2,
    saleStart: new Date("2025-09-01T00:00:00Z"),
    saleEnd: new Date("2025-11-14T18:00:00Z"),
    description: "Archived completed event pass for historical registration data.",
    seatMapImageUrl: "https://picsum.photos/seed/eventzen-seatmap-completed/1200/800",
    organizerId: ORGANIZER_ID,
    isActive: true,
  },
  {
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100005",
    eventId: EVENT_COMPLETED_ID,
    name: "Sponsor Access",
    type: "SPONSOR",
    price: 0,
    currency: "INR",
    totalQuantity: 20,
    availableQuantity: 19,
    maxPerUser: 1,
    saleStart: new Date("2025-09-01T00:00:00Z"),
    saleEnd: new Date("2025-11-14T18:00:00Z"),
    description: "Sponsor and partner entry pass.",
    seatMapImageUrl: "https://picsum.photos/seed/eventzen-seatmap-sponsor/1200/800",
    organizerId: ORGANIZER_ID,
    isActive: true,
  },
];

const registrations = [
  {
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100001",
    eventId: EVENT_OPEN_ID,
    attendeeId: ATTENDEE_ID,
    attendeeName: "Aarav Attendee",
    attendeeEmail: "attendee@eventzen.local",
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100001",
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100001",
    idempotencyKey: "seed-open-attendee-001",
    status: "CONFIRMED",
    paymentId: "pay-seed-open-attendee-001",
    amountPaid: 2499,
    registeredAt: new Date("2027-01-15T09:15:00Z"),
    cancelledAt: null,
    cancellationReason: null,
  },
  {
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100002",
    eventId: EVENT_OPEN_ID,
    attendeeId: ADMIN_ID,
    attendeeName: "System Admin",
    attendeeEmail: "admin@eventzen.local",
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100001",
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100002",
    idempotencyKey: "seed-open-admin-001",
    status: "CONFIRMED",
    paymentId: "pay-seed-open-admin-001",
    amountPaid: 2499,
    registeredAt: new Date("2027-01-20T11:45:00Z"),
    cancelledAt: null,
    cancellationReason: null,
  },
  {
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100003",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ATTENDEE_ID,
    attendeeName: "Aarav Attendee",
    attendeeEmail: "attendee@eventzen.local",
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100004",
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100003",
    idempotencyKey: "seed-completed-attendee-001",
    status: "CONFIRMED",
    paymentId: "pay-seed-completed-attendee-001",
    amountPaid: 999,
    registeredAt: new Date("2025-10-05T08:20:00Z"),
    cancelledAt: null,
    cancellationReason: null,
  },
  {
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100004",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ORGANIZER_ID,
    attendeeName: "Olivia Organizer",
    attendeeEmail: "organizer@eventzen.local",
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100005",
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100004",
    idempotencyKey: "seed-completed-organizer-001",
    status: "CONFIRMED",
    paymentId: "pay-seed-completed-organizer-001",
    amountPaid: 0,
    registeredAt: new Date("2025-10-08T10:10:00Z"),
    cancelledAt: null,
    cancellationReason: null,
  },
  {
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100005",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ADMIN_ID,
    attendeeName: "System Admin",
    attendeeEmail: "admin@eventzen.local",
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100004",
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100005",
    idempotencyKey: "seed-completed-admin-001",
    status: "CANCELLED",
    paymentId: "pay-seed-completed-admin-001",
    amountPaid: 999,
    registeredAt: new Date("2025-10-10T09:05:00Z"),
    cancelledAt: new Date("2025-10-21T14:20:00Z"),
    cancellationReason: "Cancelled by attendee",
  },
];

const tickets = [
  {
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100001",
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100001",
    eventId: EVENT_OPEN_ID,
    attendeeId: ATTENDEE_ID,
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100001",
    ticketType: "Summit Pass - General",
    eventTitle: "EventZen Product Summit 2027",
    eventDate: "2027-03-20T09:00:00+05:30",
    eventCity: "Bengaluru",
    qrCodeData: "5de3b101-8f8f-4a4e-8a01-771200100001:seed-signature",
    status: "ACTIVE",
    bookingGroupId: null,
    groupQuantity: null,
    checkedInAt: null,
    createdAt: new Date("2027-01-15T09:15:30Z"),
  },
  {
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100002",
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100002",
    eventId: EVENT_OPEN_ID,
    attendeeId: ADMIN_ID,
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100001",
    ticketType: "Summit Pass - General",
    eventTitle: "EventZen Product Summit 2027",
    eventDate: "2027-03-20T09:00:00+05:30",
    eventCity: "Bengaluru",
    qrCodeData: "5de3b101-8f8f-4a4e-8a01-771200100002:seed-signature",
    status: "ACTIVE",
    bookingGroupId: null,
    groupQuantity: null,
    checkedInAt: null,
    createdAt: new Date("2027-01-20T11:45:30Z"),
  },
  {
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100003",
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100003",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ATTENDEE_ID,
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100004",
    ticketType: "Forum Pass - General",
    eventTitle: "Community Leadership Forum 2025",
    eventDate: "2025-11-15T09:30:00+05:30",
    eventCity: "New Delhi",
    qrCodeData: "5de3b101-8f8f-4a4e-8a01-771200100003:seed-signature",
    status: "USED",
    bookingGroupId: null,
    groupQuantity: null,
    checkedInAt: new Date("2025-11-15T10:02:00Z"),
    createdAt: new Date("2025-10-05T08:20:30Z"),
  },
  {
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100004",
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100004",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ORGANIZER_ID,
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100005",
    ticketType: "Sponsor Access",
    eventTitle: "Community Leadership Forum 2025",
    eventDate: "2025-11-15T09:30:00+05:30",
    eventCity: "New Delhi",
    qrCodeData: "5de3b101-8f8f-4a4e-8a01-771200100004:seed-signature",
    status: "USED",
    bookingGroupId: null,
    groupQuantity: null,
    checkedInAt: new Date("2025-11-15T09:48:00Z"),
    createdAt: new Date("2025-10-08T10:10:30Z"),
  },
  {
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100005",
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100005",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ADMIN_ID,
    ticketTypeId: "7ad1a2de-4f19-47fd-9f57-b93000100004",
    ticketType: "Forum Pass - General",
    eventTitle: "Community Leadership Forum 2025",
    eventDate: "2025-11-15T09:30:00+05:30",
    eventCity: "New Delhi",
    qrCodeData: "5de3b101-8f8f-4a4e-8a01-771200100005:seed-signature",
    status: "CANCELLED",
    bookingGroupId: null,
    groupQuantity: null,
    checkedInAt: null,
    createdAt: new Date("2025-10-10T09:05:30Z"),
  },
];

const feedbacks = [
  {
    feedbackId: "4ac6af56-1f48-4d82-b4de-2dd900100001",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ATTENDEE_ID,
    eventRating: 5,
    vendorRating: 4,
    platformRating: 5,
    eventComment: "Excellent agenda pacing and strong moderator quality. Networking slots were productive.",
    vendorComment: "Catering and AV support were responsive throughout the day.",
    platformComment: "Checkout and ticket wallet flow felt smooth.",
    isShowcased: true,
    createdAt: new Date("2025-11-16T06:45:00Z"),
    updatedAt: new Date("2025-11-16T06:45:00Z"),
  },
  {
    feedbackId: "4ac6af56-1f48-4d82-b4de-2dd900100002",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ADMIN_ID,
    eventRating: 4,
    vendorRating: 4,
    platformRating: 4,
    eventComment: "Great content depth; would love slightly longer Q&A windows.",
    vendorComment: "Venue staff handled crowd movement well.",
    platformComment: "Good reminder notifications and pass retrieval.",
    isShowcased: true,
    createdAt: new Date("2025-11-16T08:20:00Z"),
    updatedAt: new Date("2025-11-16T08:20:00Z"),
  },
  {
    feedbackId: "4ac6af56-1f48-4d82-b4de-2dd900100003",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ORGANIZER_ID,
    eventRating: 5,
    vendorRating: 5,
    platformRating: 4,
    eventComment: "Strong turnout, actionable sessions, and high audience engagement.",
    vendorComment: "Sponsors and venue teams coordinated very well.",
    platformComment: "Reporting was helpful for post-event analysis.",
    isShowcased: true,
    createdAt: new Date("2025-11-16T10:10:00Z"),
    updatedAt: new Date("2025-11-16T10:10:00Z"),
  },
];

const checkinLogs = [
  {
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100003",
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100003",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ATTENDEE_ID,
    staffId: ORGANIZER_ID,
    gate: "Main Gate",
    checkinTime: new Date("2025-11-15T10:02:00Z"),
    method: "QR_SCAN",
  },
  {
    registrationId: "6bc1f1a0-2c27-4db4-bfa8-1ef700100004",
    ticketId: "5de3b101-8f8f-4a4e-8a01-771200100004",
    eventId: EVENT_COMPLETED_ID,
    attendeeId: ORGANIZER_ID,
    staffId: ADMIN_ID,
    gate: "VIP Gate",
    checkinTime: new Date("2025-11-15T09:48:00Z"),
    method: "QR_SCAN",
  },
];

const ticketTypeOps = ticketTypes.map((item) => ({
  updateOne: {
    filter: { ticketTypeId: item.ticketTypeId },
    update: {
      $set: { ...item, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    upsert: true,
  },
}));

const registrationOps = registrations.map((item) => ({
  updateOne: {
    filter: { registrationId: item.registrationId },
    update: {
      $set: item,
    },
    upsert: true,
  },
}));

const ticketOps = tickets.map((item) => ({
  updateOne: {
    filter: { ticketId: item.ticketId },
    update: {
      $set: item,
    },
    upsert: true,
  },
}));

const feedbackOps = feedbacks.map((item) => ({
  updateOne: {
    filter: { feedbackId: item.feedbackId },
    update: {
      $set: item,
    },
    upsert: true,
  },
}));

const checkinOps = checkinLogs.map((item) => ({
  updateOne: {
    filter: {
      registrationId: item.registrationId,
      ticketId: item.ticketId,
      checkinTime: item.checkinTime,
    },
    update: {
      $set: item,
    },
    upsert: true,
  },
}));

const ticketTypeResult = db.ticket_types.bulkWrite(ticketTypeOps, { ordered: false });
const registrationResult = db.registrations.bulkWrite(registrationOps, { ordered: false });
const ticketResult = db.tickets.bulkWrite(ticketOps, { ordered: false });
const feedbackResult = db.feedbacks.bulkWrite(feedbackOps, { ordered: false });
const checkinResult = db.checkin_logs.bulkWrite(checkinOps, { ordered: false });

print("Ticketing MongoDB indexes and demo data applied successfully.");
print(`ticket_types: matched=${ticketTypeResult.matchedCount}, upserted=${ticketTypeResult.upsertedCount}, modified=${ticketTypeResult.modifiedCount}`);
print(`registrations: matched=${registrationResult.matchedCount}, upserted=${registrationResult.upsertedCount}, modified=${registrationResult.modifiedCount}`);
print(`tickets: matched=${ticketResult.matchedCount}, upserted=${ticketResult.upsertedCount}, modified=${ticketResult.modifiedCount}`);
print(`feedbacks: matched=${feedbackResult.matchedCount}, upserted=${feedbackResult.upsertedCount}, modified=${feedbackResult.modifiedCount}`);
print(`checkin_logs: matched=${checkinResult.matchedCount}, upserted=${checkinResult.upsertedCount}, modified=${checkinResult.modifiedCount}`);
