import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { isTokenBlacklisted } from '../cache/redis';
import { AppError } from './errorHandler';

export interface AuthPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  jti: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'AUTH-1001', 'Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;

    if (decoded.jti && (await isTokenBlacklisted(decoded.jti))) {
      throw new AppError(401, 'AUTH-1001', 'Token has been revoked');
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError(401, 'AUTH-1001', 'Invalid or expired JWT'));
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'AUTH-1001', 'Authentication required'));
    }
    if (roles.length > 0 && !req.user.roles.some((r) => roles.includes(r))) {
      return next(new AppError(403, 'AUTH-1002', 'Insufficient permissions'));
    }
    next();
  };
}

export function requirePermission(module: string, action: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'AUTH-1001', 'Authentication required'));
    }
    const required = `${module}:${action}`;
    if (!req.user.permissions.includes(required)) {
      return next(new AppError(403, 'AUTH-1002', `Missing permission: ${required}`));
    }
    next();
  };
}
