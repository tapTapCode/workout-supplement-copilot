import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkoutList from '@/app/components/WorkoutList';
import { apiClient } from '@/lib/api-client';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getWorkouts: vi.fn(),
    deleteWorkout: vi.fn(),
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('WorkoutList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.getWorkouts as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<WorkoutList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display workouts when loaded', async () => {
    const mockWorkouts = {
      data: {
        data: {
          items: [
            { id: '1', name: 'Test Workout 1', description: 'Description 1' },
            { id: '2', name: 'Test Workout 2', description: 'Description 2' },
          ],
          totalPages: 1,
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.getWorkouts as any).mockResolvedValue(mockWorkouts);

    render(<WorkoutList />);

    await waitFor(() => {
      expect(screen.getByText('Test Workout 1')).toBeInTheDocument();
      expect(screen.getByText('Test Workout 2')).toBeInTheDocument();
    });
  });

  it('should display error message on failure', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.getWorkouts as any).mockResolvedValue({
      error: { code: 'ERROR', message: 'Failed to fetch workouts' },
    });

    render(<WorkoutList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch workouts/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no workouts', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiClient.getWorkouts as any).mockResolvedValue({
      data: {
        data: {
          items: [],
          totalPages: 0,
        },
      },
    });

    render(<WorkoutList />);

    await waitFor(() => {
      expect(screen.getByText(/no workouts yet/i)).toBeInTheDocument();
    });
  });
});

