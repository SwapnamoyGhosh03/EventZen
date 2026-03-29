import logger from '../utils/logger';

export interface SmsPayload {
  to: string;
  body: string;
}

export async function sendSms(payload: SmsPayload): Promise<{ success: boolean; messageId: string }> {
  // Stub: Log instead of actually sending via Twilio
  logger.info('SMS STUB: Would send SMS', {
    to: payload.to,
    bodyLength: payload.body.length,
  });

  return {
    success: true,
    messageId: `sms-stub-${Date.now()}`,
  };
}
