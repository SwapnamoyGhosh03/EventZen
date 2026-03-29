import { Request, Response, NextFunction } from 'express';
import * as webhookService from '../services/webhook.service';
import { AppError } from '../middleware/errorHandler';

export async function getWebhooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const webhooks = await webhookService.getAllWebhooks();

    res.json({
      success: true,
      data: webhooks,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url, event_types } = req.body;

    if (!url || !event_types || !Array.isArray(event_types)) {
      throw new AppError(400, 'NOTIF-4000', 'Missing required fields: url, event_types');
    }

    const webhook = await webhookService.createWebhook({
      url,
      event_types,
      created_by: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      data: webhook,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await webhookService.deleteWebhook(req.params.id as string);

    res.json({
      success: true,
      data: { message: 'Webhook subscription deleted' },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
