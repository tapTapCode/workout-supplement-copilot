import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@workout-copilot/shared';
import { HTTP_STATUS, ERROR_CODES } from '../utils/constants';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: Error | ApiError | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // If it's an AppError, use its properties
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // If it's already an ApiError, use it
  if ('code' in err && 'message' in err) {
    const statusCode = getStatusCode(err.code);
    res.status(statusCode).json({ error: err });
    return;
  }

  // Otherwise, create a generic error
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal error occurred' 
        : err.message,
    },
  });
}

function getStatusCode(code: string): number {
  const statusMap: Record<string, number> = {
    [ERROR_CODES.UNAUTHORIZED]: HTTP_STATUS.UNAUTHORIZED,
    [ERROR_CODES.FORBIDDEN]: HTTP_STATUS.FORBIDDEN,
    [ERROR_CODES.NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
    [ERROR_CODES.VALIDATION_ERROR]: HTTP_STATUS.BAD_REQUEST,
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: HTTP_STATUS.RATE_LIMIT,
    [ERROR_CODES.INTERNAL_ERROR]: HTTP_STATUS.INTERNAL_ERROR,
  };
  return statusMap[code] || HTTP_STATUS.INTERNAL_ERROR;
}
