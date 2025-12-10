'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount and when pathname changes
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        setIsAuthenticated(!!token);
      }
    };

    checkAuth();
    
    // Listen for storage changes (e.g., when token is set/removed in another tab)
    window.addEventListener('storage', checkAuth);
    
    // Listen for custom auth state change events (same tab)
    const handleAuthChange = () => checkAuth();
    window.addEventListener('authStateChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, [pathname]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('authStateChange'));
      router.push('/');
    }
  };

  const navItems = [
    { href: '/workouts', label: 'Workouts' },
    { href: '/copilot', label: 'Copilot' },
  ];

  // Don't show Sign In/Sign Out on the auth page itself (root page)
  const isAuthPage = pathname === '/';

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Workout & Supplement Copilot</h1>
          <nav className="flex gap-4 items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/workouts' && pathname.startsWith('/workouts'));
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  asChild
                  className={`transition-all duration-200 ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 hover:text-accent-foreground'
                  }`}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
            {!isAuthPage && (
              isAuthenticated ? (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground"
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  asChild
                  className={`transition-all duration-200 ${
                    pathname === '/'
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 hover:text-accent-foreground'
                  }`}
                >
                  <Link href="/">Sign In</Link>
                </Button>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

