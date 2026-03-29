import { Request, Response, NextFunction } from 'express';
import * as templateService from '../services/template.service';
import { AppError } from '../middleware/errorHandler';

export async function getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templates = await templateService.getAllTemplates();

    res.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { template_key, channel, subject, body, variables } = req.body;

    if (!template_key || !channel || !body) {
      throw new AppError(400, 'NOTIF-2000', 'Missing required fields: template_key, channel, body');
    }

    const template = await templateService.createTemplate({
      template_key,
      channel,
      subject,
      body,
      variables,
      created_by: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { subject, body, variables, is_active } = req.body;

    const template = await templateService.updateTemplate(req.params.id as string, {
      subject,
      body,
      variables,
      is_active,
      updated_by: req.user!.userId as string,
    });

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function previewTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sampleData = req.body || {};
    const result = await templateService.previewTemplate(req.params.id as string, sampleData);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
