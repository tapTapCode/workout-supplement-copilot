import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HTTP_STATUS, ERROR_CODES } from '../utils/constants';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Get JWT secret from environment
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
}

/**
 * Extract token from Authorization header
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
}

/**
 * Middleware to verify JWT token from Supabase or custom JWT
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req.headers['authorization']);

  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Authentication token required',
      },
    });
    return;
  }

  try {
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as { sub: string; email?: string };
    req.user = {
      id: decoded.sub,
      email: decoded.email || '',
    };
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Invalid or expired token',
        },
      });
    } else {
      // Only log in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('JWT verification error:', error);
      }
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Server configuration error',
        },
      });
    }
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req.headers['authorization']);

  if (token) {
    try {
      const jwtSecret = getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret) as { sub: string; email?: string };
      req.user = {
        id: decoded.sub,
        email: decoded.email || '',
      };
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}
