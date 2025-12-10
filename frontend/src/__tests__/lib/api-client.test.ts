import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';

// Mock fetch
global.fetch = vi.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    if (typeof window !== 'undefined' && window.localStorage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.localStorage.getItem as any).mockReturnValue(null);
    }
  });

  describe('getAuthToken', () => {
    it('should return token from localStorage', () => {
      const mockGetItem = vi.fn().mockReturnValue('test-token');
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: mockGetItem },
        writable: true,
      });
      // @ts-expect-error - accessing private method for testing
      const token = apiClient.getAuthToken();
      expect(token).toBe('test-token');
    });

    it('should return null if no token', () => {
      const mockGetItem = vi.fn().mockReturnValue(null);
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: mockGetItem },
        writable: true,
      });
      // @ts-expect-error - accessing private method for testing
      const token = apiClient.getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('getWorkouts', () => {
    it('should fetch workouts successfully', async () => {
      const mockWorkouts = {
        data: {
          items: [{ id: '1', name: 'Test Workout' }],
          total: 1,
          totalPages: 1,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(JSON.stringify(mockWorkouts)),
      });

      const result = await apiClient.getWorkouts(1, 10);

      expect(result.data).toBeDefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workouts'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include auth token in headers when available', async () => {
      const mockGetItem = vi.fn().mockReturnValue('test-token');
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: mockGetItem },
        writable: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(JSON.stringify({ data: { items: [] } })),
      });

      await apiClient.getWorkouts(1, 10);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle errors', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => 'application/json' },
        text: () =>
          Promise.resolve(
            JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } })
          ),
      });

      const result = await apiClient.getWorkouts(1, 10);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('createWorkout', () => {
    it('should create workout with POST request', async () => {
      const mockWorkout = { id: '1', name: 'New Workout' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        text: () => Promise.resolve(JSON.stringify({ data: mockWorkout })),
      });

      const result = await apiClient.createWorkout({
        name: 'New Workout',
        description: 'Test',
      });

      expect(result.data).toBeDefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workouts'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('New Workout'),
        })
      );
    });
  });
});

