import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { logAuditEvent, getClientIp } from '../services/auditService';

/**
 * Audit logging middleware
 * Logs all authenticated requests
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // Only log authenticated requests
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return next();
  }

  // Log after response is sent
  res.on('finish', () => {
    const action = `${req.method} ${req.path}`;
    const resourceType = req.path.split('/')[2]; // e.g., 'workouts', 'copilot'
    const resourceId = req.params.id || req.params.workout_id || undefined;

    logAuditEvent({
      user_id: authReq.user!.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
      },
      ip_address: getClientIp(req),
    });
  });

  next();
}

