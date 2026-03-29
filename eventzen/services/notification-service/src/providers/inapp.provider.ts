import logger from '../utils/logger';
import { getIO } from '../websocket/socketio';

export interface InAppPayload {
  userId: string;
  notificationId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendInApp(payload: InAppPayload): Promise<{ success: boolean; messageId: string }> {
  logger.info('IN_APP: Emitting notification via Socket.IO', {
    userId: payload.userId,
    notificationId: payload.notificationId,
  });

  try {
    const io = getIO();
    io.to(`user:${payload.userId}`).emit('notification', {
      notification_id: payload.notificationId,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('Socket.IO not available, notification stored in DB only', { error: (err as Error).message });
  }

  return {
    success: true,
    messageId: `inapp-${Date.now()}`,
  };
}
