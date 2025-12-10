/**
 * Application constants
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  USER_EXISTS: 'USER_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export const COMPLIANCE_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  RESTRICTED: 'restricted',
  BANNED: 'banned',
  UNKNOWN: 'unknown',
} as const;

export const RATE_LIMITS = {
  IP: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  COPILOT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  USER: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
} as const;

export const JWT_CONFIG = {
  EXPIRATION_DAYS: 7,
  SALT_ROUNDS: 10,
} as const;

