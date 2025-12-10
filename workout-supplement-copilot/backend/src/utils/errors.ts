import { HTTP_STATUS, ERROR_CODES } from './constants';

/**
 * Custom error classes for better error handling
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_ERROR,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ERROR_CODES.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(ERROR_CODES.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(ERROR_CODES.NOT_FOUND, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ERROR_CODES.USER_EXISTS, message, HTTP_STATUS.CONFLICT);
    this.name = 'ConflictError';
  }
}

