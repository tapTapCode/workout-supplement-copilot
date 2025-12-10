import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes';
import { query, isDatabaseConfigured } from '../../db/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../db/connection');
jest.mock('bcryptjs');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    (isDatabaseConfigured as jest.MockedFunction<typeof isDatabaseConfigured>).mockReturnValue(true);
  });

  describe('POST /api/auth/signup', () => {
    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: '12345' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 if user already exists', async () => {
      (query as jest.MockedFunction<typeof query>).mockResolvedValue([{ id: 'existing-user-id' }]);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'existing@example.com', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should create new user and return token', async () => {
      (query as jest.MockedFunction<typeof query>)
        .mockResolvedValueOnce([] as any) // Check existing user
        .mockResolvedValueOnce([{ id: 'new-user-id' }] as any); // Insert user

      (bcrypt.hash as any).mockResolvedValue('hashed-password');

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'new@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('new@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
    });

    it('should return 401 for non-existent user', async () => {
      (query as jest.MockedFunction<typeof query>).mockResolvedValue([] as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for incorrect password', async () => {
      (query as jest.MockedFunction<typeof query>).mockResolvedValue([
        {
          id: 'user-id',
          email: 'test@example.com',
          password_hash: 'hashed-password',
        },
      ]);

      (bcrypt.compare as any).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return token for valid credentials', async () => {
      (query as jest.MockedFunction<typeof query>).mockResolvedValue([
        {
          id: 'user-id',
          email: 'test@example.com',
          password_hash: 'hashed-password',
        },
      ] as any);

      (bcrypt.compare as any).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');

      // Verify token is valid
      const decoded = jwt.verify(response.body.data.token, 'test-secret') as any;
      expect(decoded.sub).toBe('user-id');
      expect(decoded.email).toBe('test@example.com');
    });
  });
});

