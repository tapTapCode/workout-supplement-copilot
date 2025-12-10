import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, optionalAuth, AuthRequest } from '../../middleware/auth';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    nextFunction = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token is provided', () => {
      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required',
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 500 if JWT_SECRET is not configured', () => {
      delete process.env.JWT_SECRET;
      delete process.env.SUPABASE_JWT_SECRET;

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', () => {
      process.env.JWT_SECRET = 'test-secret';
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid or expired token',
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() if token is valid', () => {
      process.env.JWT_SECRET = 'test-secret';
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com' },
        'test-secret'
      );

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should handle token without email', () => {
      process.env.JWT_SECRET = 'test-secret';
      const token = jwt.sign({ sub: 'user-123' }, 'test-secret');

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        id: 'user-123',
        email: '',
      });
    });
  });

  describe('optionalAuth', () => {
    it('should call next() even if no token is provided', () => {
      optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should set user if valid token is provided', () => {
      process.env.JWT_SECRET = 'test-secret';
      const token = jwt.sign(
        { sub: 'user-123', email: 'test@example.com' },
        'test-secret'
      );

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should ignore invalid tokens and call next()', () => {
      process.env.JWT_SECRET = 'test-secret';
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      optionalAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });
  });
});

