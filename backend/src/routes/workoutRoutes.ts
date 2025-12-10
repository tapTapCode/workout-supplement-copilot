import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  getUserWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  scheduleWorkout,
  getUserWorkoutSchedules,
} from '../services/workoutService';
import type {
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
  ApiResponse,
  PaginatedResponse,
  Workout,
} from '@workout-copilot/shared';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createWorkoutSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  exercises: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        muscle_groups: z.array(z.string()).default([]),
        equipment: z.string().max(100).optional(),
        instructions: z.string().max(5000).optional(),
        order_index: z.number().int().default(0),
        sets: z
          .array(
            z.object({
              sets: z.number().int().positive(),
              reps: z.number().int().positive().optional(),
              weight: z.number().positive().optional(),
              duration_seconds: z.number().int().positive().optional(),
              rest_seconds: z.number().int().positive().optional(),
              order_index: z.number().int().default(0),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

const updateWorkoutSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  exercises: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        muscle_groups: z.array(z.string()).default([]),
        equipment: z.string().max(100).optional(),
        instructions: z.string().max(5000).optional(),
        order_index: z.number().int().default(0),
        sets: z
          .array(
            z.object({
              sets: z.number().int().positive(),
              reps: z.number().int().positive().optional(),
              weight: z.number().positive().optional(),
              duration_seconds: z.number().int().positive().optional(),
              rest_seconds: z.number().int().positive().optional(),
              order_index: z.number().int().default(0),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

const scheduleWorkoutSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  time_of_day: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

/**
 * GET /api/workouts
 * List all workouts for authenticated user
 */
router.get(
  '/',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<Workout>>>) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.user!.id;

      const { workouts, total } = await getUserWorkouts(userId, page, limit);

      res.json({
        data: {
          items: workouts,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching workouts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Log full error details for debugging
      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        userId: req.user?.id,
      });
      
      // Check if it's a database connection error
      const isDatabaseError = 
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('getaddrinfo') ||
        errorMessage.includes('Cannot resolve hostname') ||
        errorMessage.includes('Database connection failed') ||
        errorMessage.includes('database server not reachable');
      
      // Extract user-friendly message for database errors
      let userMessage = 'Failed to fetch workouts';
      let errorCode = 'INTERNAL_ERROR';
      
      if (isDatabaseError) {
        errorCode = 'DATABASE_CONNECTION_ERROR';
        // Extract the key information from the detailed error message
        if (errorMessage.includes('Supabase')) {
          userMessage = 'Database connection failed. Your Supabase project may be paused or the connection string is incorrect. Please check your Supabase dashboard and update DATABASE_URL in backend/.env';
        } else {
          userMessage = 'Database connection failed. Please check your DATABASE_URL configuration in backend/.env';
        }
      } else if (errorMessage.includes('does not exist')) {
        errorCode = 'DATABASE_SCHEMA_ERROR';
        userMessage = 'Database tables not found. Please run: ./scripts/setup-database.sh';
      }
      
      res.status(500).json({
        error: {
          code: errorCode,
          message: process.env.NODE_ENV === 'development' 
            ? userMessage + (isDatabaseError ? `\n\nDetails: ${errorMessage.split('\n')[0]}` : '')
            : userMessage,
          ...(process.env.NODE_ENV === 'development' && errorStack ? { 
            details: {
              fullMessage: errorMessage,
              stack: errorStack,
            } as unknown as Record<string, unknown>
          } : {}),
        },
      });
    }
  }
);

/**
 * GET /api/workouts/:id
 * Get workout details
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<Workout>>) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const workout = await getWorkoutById(id, userId);

      if (!workout) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Workout not found',
          },
        });
        return;
      }

      res.json({ data: workout });
    } catch (error) {
      console.error('Error fetching workout:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch workout',
        },
      });
    }
  }
);

/**
 * POST /api/workouts
 * Create a new workout
 */
router.post(
  '/',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<Workout>>) => {
    try {
      const userId = req.user!.id;
      const validationResult = createWorkoutSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.errors as unknown as Record<string, unknown>,
          },
        });
        return;
      }

      const workout = await createWorkout(userId, validationResult.data as CreateWorkoutRequest);

      res.status(201).json({ data: workout });
    } catch (error) {
      console.error('Error creating workout:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create workout',
        },
      });
    }
  }
);

/**
 * PUT /api/workouts/:id
 * Update workout
 */
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<Workout>>) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const validationResult = updateWorkoutSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.errors as unknown as Record<string, unknown>,
          },
        });
        return;
      }

      const workout = await updateWorkout(id, userId, validationResult.data as UpdateWorkoutRequest);

      if (!workout) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Workout not found',
          },
        });
        return;
      }

      res.json({ data: workout });
    } catch (error) {
      console.error('Error updating workout:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update workout',
        },
      });
    }
  }
);

/**
 * DELETE /api/workouts/:id
 * Delete workout
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<{ success: boolean }>>) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const deleted = await deleteWorkout(id, userId);

      if (!deleted) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Workout not found',
          },
        });
        return;
      }

      res.json({ data: { success: true } });
    } catch (error) {
      console.error('Error deleting workout:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete workout',
        },
      });
    }
  }
);

/**
 * POST /api/workouts/:id/schedule
 * Schedule a workout
 */
router.post(
  '/:id/schedule',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<{ schedule: any }>>) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const validationResult = scheduleWorkoutSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.error.errors as unknown as Record<string, unknown>,
          },
        });
        return;
      }

      const schedule = await scheduleWorkout(
        id,
        userId,
        validationResult.data.day_of_week,
        validationResult.data.time_of_day
      );

      res.status(201).json({ data: { schedule } });
    } catch (error) {
      console.error('Error scheduling workout:', error);
      if (error instanceof Error && error.message === 'Workout not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Workout not found',
          },
        });
        return;
      }
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to schedule workout',
        },
      });
    }
  }
);

/**
 * GET /api/workouts/schedules/all
 * Get all workout schedules for user
 */
router.get(
  '/schedules/all',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<{ schedules: any[] }>>) => {
    try {
      const userId = req.user!.id;
      const schedules = await getUserWorkoutSchedules(userId);

      res.json({ data: { schedules } });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch schedules',
        },
      });
    }
  }
);

export default router;

