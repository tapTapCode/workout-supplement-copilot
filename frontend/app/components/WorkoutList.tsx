'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import type { Workout } from '@workout-copilot/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

  const loadWorkouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getWorkouts(page, 10);
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        // Backend returns: { data: { items: [], totalPages: ... } }
        // API client wraps it: { data: { data: { items: [], totalPages: ... } } }
        // So we need to check both structures
        interface PaginatedWorkoutData {
          data?: {
            items?: Workout[];
            totalPages?: number;
          };
          items?: Workout[];
          totalPages?: number;
        }
        const paginatedData = (response.data as PaginatedWorkoutData).data || response.data;
        const items = paginatedData?.items;
        const totalPages = paginatedData?.totalPages;
        
        // Ensure items is an array
        if (Array.isArray(items)) {
          setWorkouts(items);
        } else {
          setWorkouts([]);
        }
        
        // Ensure totalPages is a number
        setTotalPages(typeof totalPages === 'number' && totalPages > 0 ? totalPages : 1);
      } else {
        // If no data and no error, set empty array
        setWorkouts([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDeleteClick = (id: string) => {
    setWorkoutToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workoutToDelete) return;

    const response = await apiClient.deleteWorkout(workoutToDelete);
    if (response.error) {
      setError(response.error.message);
    } else {
      loadWorkouts();
    }
    setDeleteDialogOpen(false);
    setWorkoutToDelete(null);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading workouts...</div>;
  }

  if (error) {
    // Check if it's an authentication error
    const isAuthError = 
      error.includes('Authentication') || 
      error.includes('UNAUTHORIZED') || 
      error.includes('FORBIDDEN') ||
      error.includes('Invalid or expired token') ||
      error.includes('Authentication required');
    
    // Check if it's a database connection error
    const isDatabaseError = 
      error.includes('Database connection failed') ||
      error.includes('DATABASE_CONNECTION_ERROR') ||
      error.includes('Supabase project') ||
      error.includes('Cannot resolve hostname') ||
      error.includes('database server not reachable');
    
    if (isAuthError) {
      return (
        <Alert>
          <AlertDescription className="flex flex-col gap-2">
            <span>Please sign in to view your workouts.</span>
            <Button asChild>
              <Link href="/">Sign In</Link>
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    if (isDatabaseError) {
      return (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-3">
            <div>
              <strong>Database Connection Error</strong>
              <p className="mt-2 text-sm">
                The application cannot connect to the database. This usually means:
              </p>
              <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
                <li>Your Supabase project is paused or deleted</li>
                <li>The DATABASE_URL in backend/.env is incorrect</li>
                <li>The database server is not reachable</li>
              </ul>
            </div>
            <div className="mt-2 text-sm">
              <strong>How to fix:</strong>
              <ol className="mt-1 ml-4 list-decimal space-y-1">
                <li>Check your Supabase dashboard at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a></li>
                <li>Verify your project is active (not paused)</li>
                <li>Get the correct connection string from Settings → Database</li>
                <li>Update DATABASE_URL in backend/.env</li>
                <li>Restart the backend server</li>
              </ol>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <details>
                <summary className="cursor-pointer">Technical details</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">{error}</pre>
              </details>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Workouts</h2>
        <Button asChild>
          <Link href="/workouts/new">+ New Workout</Link>
        </Button>
      </div>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="mb-4 text-muted-foreground">No workouts yet. Create your first workout!</p>
            <Button asChild>
              <Link href="/workouts/new">Create Workout</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{workout.name}</CardTitle>
                  {workout.description && (
                    <CardDescription>{workout.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {workout.exercises && workout.exercises.length > 0 && (
                    <Badge variant="secondary">
                      {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button asChild variant="default" size="sm">
                    <Link href={`/workouts/${workout.id}`}>View</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(workout.id)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center px-4">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the workout.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

