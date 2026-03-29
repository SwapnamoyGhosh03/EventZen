import { Request, Response, NextFunction } from 'express';
import { PushToken } from '../models/pushToken.model';
import { AppError } from '../middleware/errorHandler';

export async function getTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tokens = await PushToken.find({ user_id: req.user!.userId });

    res.json({
      success: true,
      data: tokens,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function registerToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, platform } = req.body;

    if (!token || !platform) {
      throw new AppError(400, 'NOTIF-3000', 'Missing required fields: token, platform');
    }

    const existing = await PushToken.findOne({ token });
    if (existing) {
      existing.user_id = req.user!.userId;
      existing.platform = platform;
      existing.last_used_at = new Date();
      await existing.save();

      res.json({
        success: true,
        data: existing,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const pushToken = await PushToken.create({
      user_id: req.user!.userId,
      token,
      platform,
    });

    res.status(201).json({
      success: true,
      data: pushToken,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function removeToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError(400, 'NOTIF-3001', 'Missing required field: token');
    }

    const result = await PushToken.findOneAndDelete({ token, user_id: req.user!.userId });
    if (!result) {
      throw new AppError(404, 'NOTIF-3002', 'Push token not found');
    }

    res.json({
      success: true,
      data: { message: 'Push token removed' },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
