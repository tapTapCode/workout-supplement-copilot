import { query, transaction, isDatabaseConfigured } from '../db/connection';
import type {
  Workout,
  Exercise,
  ExerciseSet,
  WorkoutSchedule,
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
} from '@workout-copilot/shared';

/**
 * Get all workouts for a user
 */
export async function getUserWorkouts(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ workouts: Workout[]; total: number }> {
  if (!isDatabaseConfigured()) {
    throw new Error('Database is not configured. Please set DATABASE_URL environment variable.');
  }
  
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM workouts WHERE user_id = $1',
    [userId]
  );
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Get workouts with exercises
  const workouts = await query<Workout>(
    `SELECT 
      w.id,
      w.user_id,
      w.name,
      w.description,
      w.created_at,
      w.updated_at
    FROM workouts w
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  // Get exercises for each workout
  for (const workout of workouts) {
    // Ensure ID is a string (BIGINT from DB might be number)
    workout.id = String(workout.id);
    workout.exercises = await getWorkoutExercises(workout.id);
  }

  return { workouts, total };
}

/**
 * Get a single workout by ID
 */
export async function getWorkoutById(
  workoutId: string,
  userId: string
): Promise<Workout | null> {
  const workouts = await query<Workout>(
    `SELECT 
      w.id,
      w.user_id,
      w.name,
      w.description,
      w.created_at,
      w.updated_at
    FROM workouts w
    WHERE w.id = $1 AND w.user_id = $2`,
    [workoutId, userId]
  );

  if (workouts.length === 0) {
    return null;
  }

  const workout = workouts[0];
  // Ensure ID is a string (BIGINT from DB might be number)
  workout.id = String(workout.id);
  workout.exercises = await getWorkoutExercises(workout.id);
  return workout;
}

/**
 * Get all exercises for a workout
 */
async function getWorkoutExercises(workoutId: string): Promise<Exercise[]> {
  const exercises = await query<Exercise>(
    `SELECT 
      e.id,
      e.workout_id,
      e.name,
      e.muscle_groups,
      e.equipment,
      e.instructions,
      e.order_index,
      e.created_at
    FROM exercises e
    WHERE e.workout_id = $1
    ORDER BY e.order_index ASC`,
    [workoutId]
  );

  // Get sets for each exercise
  for (const exercise of exercises) {
    exercise.sets = await getExerciseSets(exercise.id);
  }

  return exercises;
}

/**
 * Get all sets for an exercise
 */
async function getExerciseSets(exerciseId: string): Promise<ExerciseSet[]> {
  return await query<ExerciseSet>(
    `SELECT 
      es.id,
      es.exercise_id,
      es.sets,
      es.reps,
      es.weight,
      es.duration_seconds,
      es.rest_seconds,
      es.order_index,
      es.created_at
    FROM exercise_sets es
    WHERE es.exercise_id = $1
    ORDER BY es.order_index ASC`,
    [exerciseId]
  );
}

/**
 * Create a new workout with exercises and sets
 */
export async function createWorkout(
  userId: string,
  data: CreateWorkoutRequest
): Promise<Workout> {
  return await transaction(async (client) => {
    // Create workout
    const workoutResult = await client.query<Workout>(
      `INSERT INTO workouts (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, description, created_at, updated_at`,
      [userId, data.name, data.description || null]
    );

    const workout = workoutResult.rows[0];
    // Ensure ID is a string (BIGINT from DB might be number)
    workout.id = String(workout.id);

    // Create exercises and sets if provided
    if (data.exercises && data.exercises.length > 0) {
      workout.exercises = [];
      for (let i = 0; i < data.exercises.length; i++) {
        const exerciseData = data.exercises[i];
        const exerciseResult = await client.query<Exercise>(
          `INSERT INTO exercises (
            workout_id, name, muscle_groups, equipment, instructions, order_index
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, workout_id, name, muscle_groups, equipment, instructions, order_index, created_at`,
          [
            workout.id,
            exerciseData.name,
            exerciseData.muscle_groups || [],
            exerciseData.equipment || null,
            exerciseData.instructions || null,
            exerciseData.order_index ?? i,
          ]
        );

        const exercise = exerciseResult.rows[0];
        exercise.sets = [];

        // Create sets if provided
        if (exerciseData.sets && exerciseData.sets.length > 0) {
          for (let j = 0; j < exerciseData.sets.length; j++) {
            const setData = exerciseData.sets[j];
            const setResult = await client.query<ExerciseSet>(
              `INSERT INTO exercise_sets (
                exercise_id, sets, reps, weight, duration_seconds, rest_seconds, order_index
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id, exercise_id, sets, reps, weight, duration_seconds, rest_seconds, order_index, created_at`,
              [
                exercise.id,
                setData.sets,
                setData.reps || null,
                setData.weight || null,
                setData.duration_seconds || null,
                setData.rest_seconds || null,
                setData.order_index ?? j,
              ]
            );
            exercise.sets.push(setResult.rows[0]);
          }
        }

        workout.exercises.push(exercise);
      }
    }

    return workout;
  });
}

/**
 * Update a workout
 */
export async function updateWorkout(
  workoutId: string,
  userId: string,
  data: UpdateWorkoutRequest
): Promise<Workout | null> {
  return await transaction(async (client) => {
    // Check if workout exists and belongs to user
    const existing = await client.query<Workout>(
      'SELECT id FROM workouts WHERE id = $1 AND user_id = $2',
      [workoutId, userId]
    );

    if (existing.rows.length === 0) {
      return null;
    }

    // Update workout fields
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (updates.length > 0) {
      values.push(workoutId);
      await client.query(
        `UPDATE workouts SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    // If exercises are provided, replace all exercises and sets
    if (data.exercises !== undefined) {
      // Delete existing exercises (cascade will delete sets)
      await client.query('DELETE FROM exercises WHERE workout_id = $1', [
        workoutId,
      ]);

      // Create new exercises and sets
      for (let i = 0; i < data.exercises.length; i++) {
        const exerciseData = data.exercises[i];
        const exerciseResult = await client.query<Exercise>(
          `INSERT INTO exercises (
            workout_id, name, muscle_groups, equipment, instructions, order_index
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, workout_id, name, muscle_groups, equipment, instructions, order_index, created_at`,
          [
            workoutId,
            exerciseData.name,
            exerciseData.muscle_groups || [],
            exerciseData.equipment || null,
            exerciseData.instructions || null,
            exerciseData.order_index ?? i,
          ]
        );

        const exercise = exerciseResult.rows[0];

        // Create sets if provided
        if (exerciseData.sets && exerciseData.sets.length > 0) {
          for (let j = 0; j < exerciseData.sets.length; j++) {
            const setData = exerciseData.sets[j];
            await client.query(
              `INSERT INTO exercise_sets (
                exercise_id, sets, reps, weight, duration_seconds, rest_seconds, order_index
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                exercise.id,
                setData.sets,
                setData.reps || null,
                setData.weight || null,
                setData.duration_seconds || null,
                setData.rest_seconds || null,
                setData.order_index ?? j,
              ]
            );
          }
        }
      }
    }

    // Return updated workout
    return await getWorkoutById(workoutId, userId);
  });
}

/**
 * Delete a workout
 */
export async function deleteWorkout(
  workoutId: string,
  userId: string
): Promise<boolean> {
  const result = await query<{ id: string }>(
    'DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id',
    [workoutId, userId]
  );
  return result.length > 0;
}

/**
 * Schedule a workout
 */
export async function scheduleWorkout(
  workoutId: string,
  userId: string,
  dayOfWeek: number,
  timeOfDay?: string
): Promise<WorkoutSchedule> {
  // Verify workout belongs to user
  const workout = await getWorkoutById(workoutId, userId);
  if (!workout) {
    throw new Error('Workout not found');
  }

  const schedules = await query<WorkoutSchedule>(
    `INSERT INTO workout_schedules (workout_id, user_id, day_of_week, time_of_day)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (workout_id, user_id, day_of_week) DO UPDATE
     SET time_of_day = EXCLUDED.time_of_day, updated_at = NOW()
     RETURNING id, workout_id, user_id, day_of_week, time_of_day, is_active, created_at, updated_at`,
    [workoutId, userId, dayOfWeek, timeOfDay || null]
  );

  return schedules[0];
}

/**
 * Get workout schedules for a user
 */
export async function getUserWorkoutSchedules(
  userId: string
): Promise<WorkoutSchedule[]> {
  return await query<WorkoutSchedule>(
    `SELECT 
      ws.id,
      ws.workout_id,
      ws.user_id,
      ws.day_of_week,
      ws.time_of_day,
      ws.is_active,
      ws.created_at,
      ws.updated_at
    FROM workout_schedules ws
    WHERE ws.user_id = $1 AND ws.is_active = true
    ORDER BY ws.day_of_week ASC, ws.time_of_day ASC`,
    [userId]
  );
}

