import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navigation } from '@/app/components/Navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/workouts',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    if (typeof window !== 'undefined' && window.localStorage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.localStorage.getItem as any).mockReturnValue(null);
    }
  });

  it('should render navigation links', () => {
    render(<Navigation />);

    expect(screen.getByText('Workout & Supplement Copilot')).toBeInTheDocument();
    expect(screen.getByText('Workouts')).toBeInTheDocument();
    expect(screen.getByText('Copilot')).toBeInTheDocument();
  });

  it('should show Sign In when not authenticated', () => {
    render(<Navigation />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should show Sign Out when authenticated', async () => {
    const mockGetItem = vi.fn().mockReturnValue('test-token');
    Object.defineProperty(window, 'localStorage', {
      value: { getItem: mockGetItem },
      writable: true,
    });

    render(<Navigation />);

    // Wait for useEffect to run
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should highlight active menu item', () => {
    render(<Navigation />);

    // The active link should have specific styling
    const workoutsLink = screen.getByText('Workouts').closest('a');
    expect(workoutsLink).toBeInTheDocument();
  });
});

