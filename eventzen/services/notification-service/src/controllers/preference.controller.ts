import { Request, Response, NextFunction } from 'express';
import * as preferenceService from '../services/preference.service';

export async function getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prefs = await preferenceService.getPreferences(req.user!.userId);

    res.json({
      success: true,
      data: prefs || { user_id: req.user!.userId, preferences: {} },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prefs = await preferenceService.upsertPreferences(req.user!.userId, req.body.preferences || {});

    res.json({
      success: true,
      data: prefs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
