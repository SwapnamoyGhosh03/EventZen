import { NotificationChannel } from '../models/notification.model';

export interface TopicConfig {
  channels: NotificationChannel[];
  templateKey: string;
  title: string;
  body: string | ((payload: Record<string, unknown>) => string);
  /** Field name in the Kafka payload that holds the target user's ID */
  userIdField: string;
}

export const topicHandlers: Record<string, TopicConfig> = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  'user.registered': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'user.registered',
    title: 'Welcome to EventZen!',
    body: () => 'Your account has been created. Start exploring events now.',
    userIdField: 'userId',
  },
  'user.password.reset': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'user.password.reset',
    title: 'Password Reset Request',
    body: 'A password reset was requested for your account.',
    userIdField: 'userId',
  },

  // ── Events (from event-service Java) ──────────────────────────────────────
  'event.created': {
    channels: [NotificationChannel.IN_APP],
    templateKey: 'event.created',
    title: 'Event Created',
    body: (p) => `Your event "${p.title || p.eventId}" has been created successfully.`,
    userIdField: 'organizerId',
  },
  'event.updated': {
    channels: [NotificationChannel.IN_APP],
    templateKey: 'event.updated',
    title: 'Event Updated',
    body: (p) => `Your event "${p.title || p.eventId}" has been updated.`,
    userIdField: 'organizerId',
  },
  'event.status.changed': {
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    templateKey: 'event.status.changed',
    title: 'Event Status Changed',
    body: (p) => `Event status changed: ${p.oldStatus} → ${p.newStatus}.`,
    userIdField: 'organizerId',
  },
  'event.deleted': {
    channels: [NotificationChannel.IN_APP],
    templateKey: 'event.deleted',
    title: 'Event Deleted',
    body: (p) => `Event ${p.eventId} has been deleted.`,
    userIdField: 'organizerId',
  },
  // Legacy topic kept for backward compat
  'event.published': {
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    templateKey: 'event.published',
    title: 'Event Published',
    body: (p) => `Your event "${p.title || p.eventId}" is now live.`,
    userIdField: 'organizerId',
  },
  'event.cancelled': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'event.cancelled',
    title: 'Event Cancelled',
    body: (p) => `Event "${p.title || p.eventId}" has been cancelled.`,
    userIdField: 'organizerId',
  },
  'event.reminder.24h': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'event.reminder.24h',
    title: 'Event Reminder – 24 Hours',
    body: (p) => `Reminder: event ${p.eventId} starts in 24 hours.`,
    userIdField: 'userId',
  },
  'event.reminder.1h': {
    channels: [NotificationChannel.IN_APP],
    templateKey: 'event.reminder.1h',
    title: 'Event Starting Soon – 1 Hour',
    body: (p) => `Your event ${p.eventId} starts in 1 hour!`,
    userIdField: 'userId',
  },

  // ── Ticketing (from ticketing-service .NET) ───────────────────────────────
  'registration.confirmed': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'registration.confirmed',
    title: 'Registration Confirmed',
    body: (p) =>
      `Your registration for event ${p.eventId} is confirmed! Amount paid: ₹${p.amountPaid ?? 0}.`,
    userIdField: 'attendeeId',
  },
  'ticket.purchased': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'ticket.purchased',
    title: 'Ticket Issued',
    body: (p) =>
      `Your ${p.ticketType ?? 'ticket'} (ID: ${p.ticketId}) for event ${p.eventId} is ready.`,
    userIdField: 'attendeeId',
  },
  'registration.cancelled': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'registration.cancelled',
    title: 'Registration Cancelled',
    body: (p) =>
      `Your registration for event ${p.eventId} has been cancelled.`,
    userIdField: 'attendeeId',
  },
  'waitlist.promoted': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'waitlist.promoted',
    title: 'You Are Off the Waitlist!',
    body: (p) => `A spot opened up for event ${p.eventId}. Complete your registration now.`,
    userIdField: 'attendeeId',
  },

  // ── Payments / Finance (from finance-service .NET) ────────────────────────
  'payment.received': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'payment.received',
    title: 'Payment Confirmed',
    body: (p) =>
      `Payment of ₹${p.amount ?? 0} ${p.currency ?? 'INR'} for event ${p.eventId} was received successfully.`,
    userIdField: 'userId',
  },
  'payment.failed': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'payment.failed',
    title: 'Payment Failed',
    body: (p) =>
      `Your payment of ₹${p.amount ?? 0} for event ${p.eventId} could not be processed. Please try again.`,
    userIdField: 'userId',
  },
  'budget.alert.threshold': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'budget.alert.threshold',
    title: 'Budget Alert',
    body: (p) =>
      `Budget for event ${p.eventId} has reached ${p.thresholdPercent}% utilization (₹${p.totalActual} of ₹${p.totalApproved}).`,
    userIdField: 'userId',
  },

  // ── Other ─────────────────────────────────────────────────────────────────
  'vendor.contract.signed': {
    channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    templateKey: 'vendor.contract.signed',
    title: 'Contract Signed',
    body: 'A vendor contract has been signed successfully.',
    userIdField: 'vendorId',
  },
  'checkin.milestone': {
    channels: [NotificationChannel.IN_APP],
    templateKey: 'checkin.milestone',
    title: 'Check-in Milestone',
    body: (p) => `${p.checkedIn ?? 0} attendees have checked in to event ${p.eventId}.`,
    userIdField: 'organizerId',
  },
};
