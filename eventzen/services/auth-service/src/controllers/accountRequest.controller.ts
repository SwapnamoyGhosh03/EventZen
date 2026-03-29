import { Request, Response, NextFunction } from 'express';
import * as accountRequestService from '../services/accountRequest.service';
import { accountRequestSchema, publicReactivationSchema, adminRejectSchema } from '../validators/user.validators';

function success(res: Response, data: any, meta?: any, statusCode = 200) {
  const response: any = { success: true, data, timestamp: new Date().toISOString() };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export async function createRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const body = accountRequestSchema.parse(req.body);
    const result = await accountRequestService.createRequest(req.user!.userId as string, body.type, body.reason);
    success(res, result, undefined, 201);
  } catch (err) { next(err); }
}

export async function getMyRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 20;
    const result = await accountRequestService.getMyRequests(req.user!.userId, page, size);
    success(res, result.data, result.meta);
  } catch (err) { next(err); }
}

export async function cancelRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await accountRequestService.cancelRequest(req.params.id as string, req.user!.userId as string);
    success(res, { message: 'Request cancelled' });
  } catch (err) { next(err); }
}

export async function publicReactivation(req: Request, res: Response, next: NextFunction) {
  try {
    const body = publicReactivationSchema.parse(req.body);
    const result = await accountRequestService.createPublicReactivation(body.email, body.reason);
    success(res, result, undefined, 201);
  } catch (err) { next(err); }
}

export async function checkReactivationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ success: false, error: { code: 'AUTH-1010', message: 'Email required' } });
    const result = await accountRequestService.checkReactivationStatus(email);
    success(res, result);
  } catch (err) { next(err); }
}

export async function getAdminQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const params = {
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      size: parseInt(req.query.size as string) || 20,
    };
    const result = await accountRequestService.getAdminQueue(params);
    success(res, result.data, result.meta);
  } catch (err) { next(err); }
}

export async function approveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await accountRequestService.approveRequest(req.params.id as string, req.user!.userId as string);
    success(res, result);
  } catch (err) { next(err); }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const body = adminRejectSchema.parse(req.body);
    const result = await accountRequestService.rejectRequest(req.params.id as string, req.user!.userId as string, body.adminNotes);
    success(res, result);
  } catch (err) { next(err); }
}
