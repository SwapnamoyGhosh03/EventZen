import logger from '../utils/logger';

export interface PushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPush(payload: PushPayload): Promise<{ success: boolean; messageId: string }> {
  // Stub: Log instead of actually sending via FCM
  logger.info('PUSH STUB: Would send push notification', {
    tokenCount: payload.tokens.length,
    title: payload.title,
    bodyLength: payload.body.length,
  });

  return {
    success: true,
    messageId: `push-stub-${Date.now()}`,
  };
}
