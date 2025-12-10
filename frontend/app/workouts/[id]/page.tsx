'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Workout } from '@workout-copilot/shared';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import WorkoutSchedule from '@/app/components/WorkoutSchedule';

export default function WorkoutDetailPage() {
  const params = useParams();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkout = async () => {
      if (!params.id || typeof params.id !== 'string') return;

      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.getWorkout(params.id);
        
        if (response.error) {
          setError(response.error.message);
        } else if (response.data) {
          // Handle nested response structure: response.data.data or response.data
          interface WorkoutResponse {
            data?: Workout;
          }
          const workoutResponse = response.data as WorkoutResponse;
          const workout = workoutResponse.data || response.data;
          if (workout) {
            setWorkout(workout);
          } else {
            setError('Workout data not found in response');
          }
        } else {
          setError('No data returned from server');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workout');
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-8">Loading workout...</div>;
  }

  if (error || !workout) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Workout not found'}</AlertDescription>
        </Alert>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/">← Back to workouts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">← Back to workouts</Link>
        </Button>
        <h1 className="text-3xl font-bold">{workout.name}</h1>
        {workout.description && (
          <p className="text-muted-foreground mt-2">{workout.description}</p>
        )}
      </div>

      {workout.exercises && workout.exercises.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Exercises</h2>
          {workout.exercises.map((exercise) => (
            <Card key={exercise.id}>
              <CardHeader>
                <CardTitle>{exercise.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Muscle groups: {exercise.muscle_groups.join(', ')}
                  </p>
                )}
                {exercise.equipment && (
                  <p className="text-sm text-muted-foreground">Equipment: {exercise.equipment}</p>
                )}
                {exercise.instructions && (
                  <p className="text-sm text-foreground mb-3">{exercise.instructions}</p>
                )}
                {exercise.sets && exercise.sets.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Sets:</h4>
                    <div className="space-y-1">
                      {exercise.sets.map((set, idx) => (
                        <div key={set.id || idx} className="text-sm text-muted-foreground">
                          Set {idx + 1}: {set.sets} ×{' '}
                          {set.reps && `${set.reps} reps`}
                          {set.weight && ` @ ${set.weight}lbs`}
                          {set.duration_seconds && ` (${set.duration_seconds}s)`}
                          {set.rest_seconds && ` - Rest: ${set.rest_seconds}s`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No exercises added yet.</p>
      )}

      <div className="mt-8 space-y-6">
        <WorkoutSchedule workoutId={workout.id.toString()} />

        <Button asChild size="lg" className="w-full">
          <Link href={`/copilot?workout_id=${workout.id}`}>
            Get Supplement Recommendations →
          </Link>
        </Button>
      </div>
    </div>
  );
}

