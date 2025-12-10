'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GalleryVerticalEnd } from 'lucide-react';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate password
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Use signup endpoint for sign up, login endpoint for login
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || (isLogin ? 'Login failed' : 'Sign up failed'));
      }

      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        // Trigger custom event so Navigation component updates immediately
        window.dispatchEvent(new Event('authStateChange'));
        // Redirect to workouts page after successful auth
        router.push('/workouts');
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (isLogin ? 'Login failed' : 'Sign up failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div>
                <h1 className="text-2xl font-bold">
                  {isLogin ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="text-muted-foreground text-balance mt-1">
                  {isLogin 
                    ? 'Login to your Workout & Supplement Copilot account' 
                    : 'Sign up to get started with Workout & Supplement Copilot'}
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  {isLogin && (
                    <Link
                      href="#"
                      className="text-sm text-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        // TODO: Implement forgot password
                      }}
                    >
                      Forgot your password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </Field>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign up'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Link
                  href="#"
                  className="text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLogin(!isLogin);
                  }}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </Link>
              </p>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-primary/10 rounded-full p-8">
                  <GalleryVerticalEnd className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">
                    Workout & Supplement Copilot
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our{' '}
        <Link href="#" className="underline hover:text-primary">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="#" className="underline hover:text-primary">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

