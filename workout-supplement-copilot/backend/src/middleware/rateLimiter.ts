import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { RATE_LIMITS, ERROR_CODES, HTTP_STATUS } from '../utils/constants';

// Simple in-memory rate limiter (for MVP - use Redis in production)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
// Use unref() to allow process to exit when tests complete
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);
cleanupInterval.unref();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  message?: string;
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyGenerator, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator
      ? keyGenerator(req)
      : (req as AuthRequest).user?.id || req.ip || 'anonymous';

    const now = Date.now();
    const record = store[key];

    if (!record || record.resetTime < now) {
      // Create new window
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.status(HTTP_STATUS.RATE_LIMIT).json({
        error: {
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: message || 'Too many requests, please try again later',
          details: {
            retryAfter,
          },
        },
      });
      return;
    }

    // Increment count
    record.count++;
    next();
  };
}

// Pre-configured rate limiters
export const perUserRateLimiter = rateLimiter({
  windowMs: RATE_LIMITS.USER.windowMs,
  maxRequests: RATE_LIMITS.USER.maxRequests,
  keyGenerator: (req) => `user:${(req as AuthRequest).user?.id || 'anonymous'}`,
  message: 'Rate limit exceeded. Please try again in a minute.',
});

export const copilotRateLimiter = rateLimiter({
  windowMs: RATE_LIMITS.COPILOT.windowMs,
  maxRequests: RATE_LIMITS.COPILOT.maxRequests,
  keyGenerator: (req) => `copilot:${(req as AuthRequest).user?.id || 'anonymous'}`,
  message: 'Maximum 10 recommendations per hour. Please try again later.',
});

export const ipRateLimiter = rateLimiter({
  windowMs: RATE_LIMITS.IP.windowMs,
  maxRequests: RATE_LIMITS.IP.maxRequests,
  keyGenerator: (req) => `ip:${req.ip || 'unknown'}`,
  message: 'Too many requests from this IP. Please try again in a minute.',
});

