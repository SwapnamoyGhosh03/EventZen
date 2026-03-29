import { Webhook, IWebhook } from '../models/webhook.model';
import { AppError } from '../middleware/errorHandler';

export async function getAllWebhooks(): Promise<IWebhook[]> {
  return Webhook.find().sort({ createdAt: -1 });
}

export async function createWebhook(data: {
  url: string;
  event_types: string[];
  created_by: string;
}): Promise<IWebhook> {
  return Webhook.create({
    url: data.url,
    event_types: data.event_types,
    created_by: data.created_by,
  });
}

export async function deleteWebhook(id: string): Promise<void> {
  const result = await Webhook.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(404, 'NOTIF-4001', 'Webhook subscription not found');
  }
}

export async function getWebhooksForEvent(eventType: string): Promise<IWebhook[]> {
  return Webhook.find({
    event_types: eventType,
    is_active: true,
  });
}
