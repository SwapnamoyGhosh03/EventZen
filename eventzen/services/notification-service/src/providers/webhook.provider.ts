import logger from '../utils/logger';
import { generateHmacSignature } from '../utils/hmac';

export interface WebhookPayload {
  url: string;
  secret: string;
  eventType: string;
  data: Record<string, unknown>;
}

export async function sendWebhook(payload: WebhookPayload): Promise<{ success: boolean; messageId: string; statusCode: number }> {
  const body = JSON.stringify({
    event: payload.eventType,
    data: payload.data,
    timestamp: new Date().toISOString(),
  });

  const signature = generateHmacSignature(body, payload.secret);

  logger.info('WEBHOOK: Sending HTTP POST', {
    url: payload.url,
    eventType: payload.eventType,
  });

  try {
    const response = await fetch(payload.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-EventZen-Signature': `sha256=${signature}`,
        'X-EventZen-Event': payload.eventType,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    return {
      success: response.ok,
      messageId: `webhook-${Date.now()}`,
      statusCode: response.status,
    };
  } catch (err) {
    logger.error('WEBHOOK: Delivery failed', { url: payload.url, error: (err as Error).message });
    return {
      success: false,
      messageId: `webhook-${Date.now()}`,
      statusCode: 0,
    };
  }
}
