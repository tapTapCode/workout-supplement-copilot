import { query } from '../db/connection';

export interface AuditLog {
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(log: AuditLog): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, details, ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        log.user_id || null,
        log.action,
        log.resource_type || null,
        log.resource_id || null,
        log.details ? JSON.stringify(log.details) : null,
        log.ip_address || null,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging should not break the application
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Middleware helper to extract IP address
 */
export function getClientIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string | undefined {
  // Check X-Forwarded-For header (for proxies/load balancers)
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to req.ip
  return req.ip;
}

