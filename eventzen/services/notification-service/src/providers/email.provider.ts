import logger from '../utils/logger';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }> {
  // Stub: Log instead of actually sending via SendGrid
  logger.info('EMAIL STUB: Would send email', {
    to: payload.to,
    subject: payload.subject,
    bodyLength: payload.body.length,
  });

  return {
    success: true,
    messageId: `email-stub-${Date.now()}`,
  };
}
