import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WEBHOOK = 'WEBHOOK',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
}

export interface INotification extends Document {
  notification_id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  data: Record<string, unknown>;
  read_at: Date | null;
  created_at: Date;
  expires_at: Date | null;
  deleted: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    notification_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, required: true },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
      index: true,
    },
    data: { type: Schema.Types.Mixed, default: {} },
    read_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now, index: true },
    expires_at: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: false }
);

notificationSchema.index({ user_id: 1, status: 1, created_at: -1 });
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema, 'notifications');
