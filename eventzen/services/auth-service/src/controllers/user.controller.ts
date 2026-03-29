import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { listUsersSchema, assignRolesSchema } from '../validators/user.validators';

function success(res: Response, data: any, meta?: any, statusCode = 200) {
  const response: any = { success: true, data, timestamp: new Date().toISOString() };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listUsersSchema.parse(req.query);
    const result = await userService.listUsers(params);
    success(res, result.data, result.meta);
  } catch (err) { next(err); }
}

export async function assignRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const body = assignRolesSchema.parse(req.body);
    const result = await userService.assignRoles(req.params.id as string, body.roles, req.user!.userId as string);
    success(res, result);
  } catch (err) { next(err); }
}

export async function deactivateUser(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.deactivateUser(req.params.id as string, req.user!.userId as string);
    success(res, { message: 'User deactivated' });
  } catch (err) { next(err); }
}

export async function reactivateUser(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.reactivateUser(req.params.id as string, req.user!.userId as string);
    success(res, { message: 'User reactivated' });
  } catch (err) { next(err); }
}

export async function gdprDelete(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.gdprDelete(req.params.id as string, req.user!.userId as string);
    success(res, { message: 'User data deleted per GDPR' });
  } catch (err) { next(err); }
}
