'use client';

import { useRouter } from 'next/navigation';
import WorkoutForm from '@/app/components/WorkoutForm';
import { apiClient } from '@/lib/api-client';
import type { CreateWorkoutRequest } from '@workout-copilot/shared';

export default function NewWorkoutPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateWorkoutRequest) => {
    try {
      const response = await apiClient.createWorkout(data);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        // Handle nested response structure: response.data.data or response.data
        interface WorkoutResponse {
          data?: {
            id: string | number;
          };
          id?: string | number;
        }
        const workoutResponse = response.data as WorkoutResponse;
        const workout = workoutResponse.data || response.data;
        if (workout && workout.id) {
          // Ensure ID is converted to string for URL
          router.push(`/workouts/${String(workout.id)}`);
        } else {
          throw new Error('Workout created but ID not found in response');
        }
      } else {
        throw new Error('No data returned from server');
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Create New Workout</h1>
      <WorkoutForm onSubmit={handleSubmit} onCancel={() => router.push('/')} />
    </div>
  );
}

