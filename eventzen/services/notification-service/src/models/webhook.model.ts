import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { generateSecret } from '../utils/hmac';

export interface IWebhook extends Document {
  webhook_id: string;
  url: string;
  event_types: string[];
  secret: string;
  is_active: boolean;
  created_by: string;
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    webhook_id: { type: String, default: () => uuidv4(), unique: true },
    url: { type: String, required: true },
    event_types: [{ type: String }],
    secret: { type: String, default: () => generateSecret() },
    is_active: { type: Boolean, default: true },
    created_by: { type: String, required: true },
  },
  { timestamps: true, collection: 'webhook_subscriptions' }
);

export const Webhook = mongoose.model<IWebhook>('Webhook', webhookSchema);
