import mongoose, { Schema, Document } from 'mongoose';

export enum DeliveryStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export interface IDeliveryLog extends Document {
  notification_id: string;
  correlation_id: string;
  channel: string;
  provider: string;
  attempt: number;
  status: DeliveryStatus;
  provider_response_code: string;
  provider_message_id: string;
  error_message: string;
  sent_at: Date;
}

const deliveryLogSchema = new Schema<IDeliveryLog>(
  {
    notification_id: { type: String, required: true, index: true },
    correlation_id: { type: String, required: true, unique: true },
    channel: { type: String, required: true },
    provider: { type: String, required: true },
    attempt: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      required: true,
    },
    provider_response_code: { type: String, default: '' },
    provider_message_id: { type: String, default: '' },
    error_message: { type: String, default: '' },
    sent_at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false, collection: 'delivery_logs' }
);

export const DeliveryLog = mongoose.model<IDeliveryLog>('DeliveryLog', deliveryLogSchema);
