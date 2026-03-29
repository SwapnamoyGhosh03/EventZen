import { v4 as uuidv4 } from 'uuid';
import { Notification, INotification, NotificationChannel, NotificationStatus } from '../models/notification.model';
import { DeliveryLog, DeliveryStatus } from '../models/deliveryLog.model';
import { PushToken } from '../models/pushToken.model';
import { AppError } from '../middleware/errorHandler';
import { getTemplateByKey, renderTemplate } from './template.service';
import { getPreferences, isChannelAllowed } from './preference.service';
import { getWebhooksForEvent } from './webhook.service';
import { sendEmail } from '../providers/email.provider';
import { sendSms } from '../providers/sms.provider';
import { sendPush } from '../providers/push.provider';
import { sendInApp } from '../providers/inapp.provider';
import { sendWebhook } from '../providers/webhook.provider';
import logger from '../utils/logger';

const MAX_RETRIES = 3;

interface SendNotificationInput {
  user_id: string;
  title: string;
  body?: string;
  type: string;
  channels: NotificationChannel[];
  data?: Record<string, unknown>;
  template_key?: string;
  template_vars?: Record<string, unknown>;
  correlation_id?: string;
  expires_at?: string;
}

export async function sendNotification(input: SendNotificationInput): Promise<INotification[]> {
  const results: INotification[] = [];

  for (const channel of input.channels) {
    const correlationId = input.correlation_id
      ? `${input.correlation_id}-${channel}`
      : `${uuidv4()}`;

    // Dedup check
    const existingLog = await DeliveryLog.findOne({ correlation_id: correlationId });
    if (existingLog) {
      logger.info('Duplicate notification skipped', { correlationId });
      continue;
    }

    // Check user preferences
    const prefs = await getPreferences(input.user_id);
    if (!isChannelAllowed(prefs, input.type, channel)) {
      logger.info('Notification blocked by user preference', {
        userId: input.user_id,
        eventType: input.type,
        channel,
      });
      continue;
    }

    // Resolve body via template or direct input
    let resolvedTitle = input.title;
    let resolvedBody = input.body || '';

    if (input.template_key) {
      const templateKey = `${input.template_key}.${channel.toLowerCase()}`;
      const template = await getTemplateByKey(templateKey);
      if (template) {
        const vars = { ...input.data, ...input.template_vars };
        if (template.subject) resolvedTitle = renderTemplate(template.subject, vars);
        resolvedBody = renderTemplate(template.body, vars);
      }
    }

    // Create notification record
    const notification = await Notification.create({
      notification_id: uuidv4(),
      user_id: input.user_id,
      title: resolvedTitle,
      body: resolvedBody,
      type: input.type,
      channel,
      status: NotificationStatus.PENDING,
      data: input.data || {},
      expires_at: input.expires_at ? new Date(input.expires_at) : null,
    });

    // Dispatch
    await dispatchWithRetry(notification, correlationId);
    results.push(notification);
  }

  return results;
}

async function dispatchWithRetry(notification: INotification, correlationId: string, attempt = 1): Promise<void> {
  try {
    const result = await dispatchToChannel(notification);

    await DeliveryLog.create({
      notification_id: notification.notification_id,
      correlation_id: correlationId,
      channel: notification.channel,
      provider: getProviderName(notification.channel),
      attempt,
      status: result.success ? DeliveryStatus.SUCCESS : DeliveryStatus.FAILED,
      provider_message_id: result.messageId,
      provider_response_code: result.success ? '200' : '500',
      error_message: result.success ? '' : 'Delivery failed',
    });

    if (result.success) {
      notification.status = NotificationStatus.SENT;
    } else if (attempt < MAX_RETRIES) {
      await DeliveryLog.findOneAndUpdate(
        { correlation_id: correlationId },
        { status: DeliveryStatus.RETRYING }
      );
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return dispatchWithRetry(notification, `${correlationId}-retry${attempt + 1}`, attempt + 1);
    } else {
      notification.status = NotificationStatus.FAILED;
    }

    await notification.save();
  } catch (err) {
    logger.error('Dispatch error', { notificationId: notification.notification_id, error: (err as Error).message });

    await DeliveryLog.create({
      notification_id: notification.notification_id,
      correlation_id: correlationId,
      channel: notification.channel,
      provider: getProviderName(notification.channel),
      attempt,
      status: DeliveryStatus.FAILED,
      error_message: (err as Error).message,
    });

    if (attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return dispatchWithRetry(notification, `${correlationId}-retry${attempt + 1}`, attempt + 1);
    }

    notification.status = NotificationStatus.FAILED;
    await notification.save();
  }
}

async function dispatchToChannel(notification: INotification): Promise<{ success: boolean; messageId: string }> {
  switch (notification.channel) {
    case NotificationChannel.EMAIL:
      return sendEmail({
        to: (notification.data as Record<string, string>).email || notification.user_id,
        subject: notification.title,
        body: notification.body,
      });

    case NotificationChannel.SMS:
      return sendSms({
        to: (notification.data as Record<string, string>).phone || notification.user_id,
        body: notification.body,
      });

    case NotificationChannel.PUSH: {
      const tokens = await PushToken.find({ user_id: notification.user_id });
      if (tokens.length === 0) {
        logger.warn('No push tokens found for user', { userId: notification.user_id });
        return { success: true, messageId: `push-no-tokens-${Date.now()}` };
      }
      return sendPush({
        tokens: tokens.map((t) => t.token),
        title: notification.title,
        body: notification.body,
        data: notification.data as Record<string, unknown>,
      });
    }

    case NotificationChannel.IN_APP:
      return sendInApp({
        userId: notification.user_id,
        notificationId: notification.notification_id,
        title: notification.title,
        body: notification.body,
        data: notification.data as Record<string, unknown>,
      });

    case NotificationChannel.WEBHOOK: {
      const webhooks = await getWebhooksForEvent(notification.type);
      for (const wh of webhooks) {
        await sendWebhook({
          url: wh.url,
          secret: wh.secret,
          eventType: notification.type,
          data: {
            notification_id: notification.notification_id,
            title: notification.title,
            body: notification.body,
            ...((notification.data as Record<string, unknown>) || {}),
          },
        });
      }
      return { success: true, messageId: `webhook-batch-${Date.now()}` };
    }

    default:
      throw new Error(`Unsupported channel: ${notification.channel}`);
  }
}

function getProviderName(channel: NotificationChannel): string {
  const map: Record<string, string> = {
    EMAIL: 'sendgrid-stub',
    SMS: 'twilio-stub',
    PUSH: 'fcm-stub',
    IN_APP: 'socketio',
    WEBHOOK: 'http-post',
  };
  return map[channel] || 'unknown';
}

export async function getNotifications(
  userId: string,
  options: { page: number; limit: number; status?: string }
): Promise<{ notifications: INotification[]; total: number }> {
  const filter: Record<string, unknown> = { user_id: userId, deleted: false };
  if (options.status) filter.status = options.status;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ created_at: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Notification.countDocuments(filter),
  ]);

  return { notifications, total };
}

export async function getNotificationById(notificationId: string, userId: string): Promise<INotification> {
  const notification = await Notification.findOne({
    notification_id: notificationId,
    deleted: false,
  });

  if (!notification) {
    throw new AppError(404, 'NOTIF-1001', 'Notification not found');
  }

  if (notification.user_id !== userId) {
    throw new AppError(403, 'NOTIF-1002', 'Access denied');
  }

  return notification;
}

export async function markAsRead(notificationId: string, userId: string): Promise<INotification> {
  const notification = await getNotificationById(notificationId, userId);

  if (notification.status === NotificationStatus.READ) {
    notification.status = NotificationStatus.DELIVERED;
    notification.read_at = null;
  } else {
    notification.status = NotificationStatus.READ;
    notification.read_at = new Date();
  }

  return notification.save();
}

export async function softDeleteNotification(notificationId: string, userId: string): Promise<void> {
  const notification = await getNotificationById(notificationId, userId);
  notification.deleted = true;
  await notification.save();
}

export async function markAllAsRead(userId: string): Promise<number> {
  const result = await Notification.updateMany(
    { user_id: userId, deleted: false, status: { $ne: NotificationStatus.READ } },
    { $set: { status: NotificationStatus.READ, read_at: new Date() } }
  );
  return result.modifiedCount;
}

export async function getUnreadCount(userId: string): Promise<number> {
  return Notification.countDocuments({
    user_id: userId,
    deleted: false,
    status: { $nin: [NotificationStatus.READ] },
  });
}

export async function getDeliveryLogs(options: { page: number; limit: number }): Promise<{ logs: unknown[]; total: number }> {
  const [logs, total] = await Promise.all([
    DeliveryLog.find()
      .sort({ sent_at: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    DeliveryLog.countDocuments(),
  ]);

  return { logs, total };
}
