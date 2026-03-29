import { Request, Response, NextFunction } from 'express';
import { logAudit } from '../utils/audit';

export function auditLog(action: string, resourceType: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await logAudit({
        userId: req.user?.userId as string | undefined,
        action,
        resourceType,
        resourceId: req.params.id as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });
    } catch {
      // don't block request if audit logging fails
    }
    next();
  };
}
