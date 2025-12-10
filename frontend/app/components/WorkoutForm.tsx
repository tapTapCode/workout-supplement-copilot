'use client';

import { useState } from 'react';
import type { CreateWorkoutRequest, Exercise, ExerciseSet } from '@workout-copilot/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface WorkoutFormProps {
  onSubmit: (data: CreateWorkoutRequest) => Promise<void>;
  onCancel?: () => void;
  initialData?: CreateWorkoutRequest;
}

type ExerciseFormData = Omit<Exercise, 'id' | 'workout_id' | 'created_at' | 'sets'> & {
  sets?: Array<Omit<ExerciseSet, 'id' | 'exercise_id' | 'created_at'>>;
};

export default function WorkoutForm({ onSubmit, onCancel, initialData }: WorkoutFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [exercises, setExercises] = useState<ExerciseFormData[]>(initialData?.exercises || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        muscle_groups: [],
        equipment: '',
        instructions: '',
        order_index: exercises.length,
        sets: [],
      },
    ]);
  };

  const updateExercise = (index: number, updates: Partial<ExerciseFormData>) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], ...updates };
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const exercise = updated[exerciseIndex];
    const sets: Array<Omit<ExerciseSet, 'id' | 'exercise_id' | 'created_at'>> = [
      ...(exercise.sets || []),
    ];
    sets.push({
      sets: 1,
      reps: 10,
      weight: 0,
      order_index: sets.length,
    });
    updateExercise(exerciseIndex, { sets });
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<Omit<ExerciseSet, 'id' | 'exercise_id' | 'created_at'>>
  ) => {
    const updated = [...exercises];
    const exercise = updated[exerciseIndex];
    const sets: Array<Omit<ExerciseSet, 'id' | 'exercise_id' | 'created_at'>> = [
      ...(exercise.sets || []),
    ];
    sets[setIndex] = { ...sets[setIndex], ...updates };
    updateExercise(exerciseIndex, { sets });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    const exercise = updated[exerciseIndex];
    const sets: Array<Omit<ExerciseSet, 'id' | 'exercise_id' | 'created_at'>> = (
      exercise.sets || []
    ).filter((_, i) => i !== setIndex);
    updateExercise(exerciseIndex, { sets });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Workout name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        exercises:
          exercises.length > 0
            ? (exercises as Omit<Exercise, 'id' | 'workout_id' | 'created_at'>[])
            : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          Workout Name *
        </Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., Upper Body Strength"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional description..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Exercises</Label>
          <Button type="button" onClick={addExercise} size="sm">
            + Add Exercise
          </Button>
        </div>

        {exercises.map((exercise, exerciseIndex) => (
          <Card key={exerciseIndex}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <Input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => updateExercise(exerciseIndex, { name: e.target.value })}
                  placeholder="Exercise name"
                  className="flex-1 mr-2"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExercise(exerciseIndex)}
                >
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={exercise.equipment || ''}
                  onChange={(e) => updateExercise(exerciseIndex, { equipment: e.target.value })}
                  placeholder="Equipment"
                  className="text-sm"
                />
                <Input
                  type="text"
                  value={exercise.muscle_groups?.join(', ') || ''}
                  onChange={(e) =>
                    updateExercise(exerciseIndex, {
                      muscle_groups: e.target.value.split(',').map((g) => g.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Muscle groups (comma-separated)"
                  className="text-sm"
                />
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSet(exerciseIndex)}
                >
                  + Add Set
                </Button>
              </div>

              {exercise.sets?.map((set, setIndex) => (
                <div key={setIndex} className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={set.sets}
                    onChange={(e) =>
                      updateSet(exerciseIndex, setIndex, { sets: parseInt(e.target.value) || 1 })
                    }
                    placeholder="Sets"
                    className="w-20"
                  />
                  <Input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) =>
                      updateSet(exerciseIndex, setIndex, { reps: parseInt(e.target.value) || undefined })
                    }
                    placeholder="Reps"
                    className="w-24"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={set.weight || ''}
                    onChange={(e) =>
                      updateSet(exerciseIndex, setIndex, {
                        weight: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="Weight (lbs)"
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSet(exerciseIndex, setIndex)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Workout'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

