import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { rateLimiter, ipRateLimiter, copilotRateLimiter } from '../../middleware/rateLimiter';
import { AuthRequest } from '../../middleware/auth';

describe('Rate Limiter', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = rateLimiter({
        windowMs: 60000,
        maxRequests: 5,
      });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        limiter(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );
      }

      expect(nextFunction).toHaveBeenCalledTimes(5);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding limit', () => {
      const limiter = rateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (req) => `test:${req.ip || 'unknown'}`,
      });

      // Make 3 requests
      limiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      limiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
        limiter(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

      expect(nextFunction).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'RATE_LIMIT_EXCEEDED',
          }),
        })
      );
    });
  });

  describe('ipRateLimiter', () => {
    it('should use IP address as key', () => {
      ipRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('copilotRateLimiter', () => {
    it('should use user ID as key when authenticated', () => {
      const authRequest = {
        ...mockRequest,
        user: { id: 'user-123', email: 'test@example.com' },
      } as AuthRequest;

      copilotRateLimiter(
        authRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should use IP as fallback when not authenticated', () => {
      copilotRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});

