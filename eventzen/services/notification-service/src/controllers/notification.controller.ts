import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';

export async function sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user_id, title, body, type, channels, data, template_key, template_vars, correlation_id, expires_at } = req.body;

    if (!user_id || !title || !type || !channels || !Array.isArray(channels)) {
      throw new AppError(400, 'NOTIF-1000', 'Missing required fields: user_id, title, type, channels');
    }

    const results = await notificationService.sendNotification({
      user_id,
      title,
      body,
      type,
      channels,
      data,
      template_key,
      template_vars,
      correlation_id,
      expires_at,
    });

    res.status(201).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;

    const { notifications, total } = await notificationService.getNotifications(userId, { page, limit, status });

    res.json({
      success: true,
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getNotificationById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await notificationService.getNotificationById(req.params.id as string, req.user!.userId as string);

    res.json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await notificationService.markAsRead(req.params.id as string, req.user!.userId as string);

    res.json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.softDeleteNotification(req.params.id as string, req.user!.userId as string);

    res.json({
      success: true,
      data: { message: 'Notification deleted' },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.markAllAsRead(req.user!.userId);
    res.json({
      success: true,
      data: { markedCount: count },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    res.json({
      success: true,
      data: { count },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function getDeliveryLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { logs, total } = await notificationService.getDeliveryLogs({ page, limit });

    res.json({
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
