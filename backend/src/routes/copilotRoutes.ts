import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { copilotRateLimiter } from '../middleware/rateLimiter';
import { getRecommendation } from '../services/copilotService';
import { query } from '../db/connection';
import type {
  CopilotRecommendRequest,
  CopilotRecommendation,
  ApiResponse,
  PaginatedResponse,
} from '@workout-copilot/shared';
import { z } from 'zod';

const router = Router();

const recommendSchema = z.object({
  workout_id: z.union([
    z.string().regex(/^\d+$/, 'Workout ID must be a numeric string'),
    z.number().int().positive(),
    z.string().uuid(), // Also allow UUID format for flexibility
  ]).optional().transform((val) => {
    // Convert to string if it's a number (BIGINT from database)
    return val !== undefined ? String(val) : undefined;
  }),
  user_goals: z.array(z.string().min(1)).min(1).optional(),
  health_conditions: z.array(z.string().min(1)).min(1).optional(),
}).refine(
  (data) => data.workout_id || (data.user_goals && data.user_goals.length > 0),
  {
    message: 'Either workout_id or user_goals must be provided',
  }
);

/**
 * POST /api/copilot/recommend
 * Get supplement recommendations
 */
router.post(
  '/recommend',
  authenticateToken,
  copilotRateLimiter,
  async (req: AuthRequest, res: Response<ApiResponse<{ recommendation: CopilotRecommendation }>>) => {
    try {
      const userId = req.user!.id;
      const validationResult = recommendSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map((err) => 
          `${err.path.join('.')}: ${err.message}`
        ).join('; ');
        
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid request data: ${errorMessages}`,
            details: validationResult.error.errors as unknown as Record<string, unknown>,
          },
        });
        return;
      }

      const recommendation = await getRecommendation(userId, validationResult.data);

      res.json({
        data: {
          recommendation,
        },
      });
    } catch (error) {
      console.error('Error getting recommendation:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get recommendation',
        },
      });
    }
  }
);

/**
 * GET /api/copilot/recommendations
 * Get recommendation history
 */
router.get(
  '/recommendations',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<CopilotRecommendation>>>) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM copilot_recommendations WHERE user_id = $1',
        [userId]
      );
      const total = parseInt(countResult[0]?.count || '0', 10);

      // Get recommendations
      const recommendations = await query<CopilotRecommendation>(
        `SELECT 
          id, user_id, workout_id, recommendation_text, reasoning, created_at
        FROM copilot_recommendations
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Fetch citations for each recommendation
      for (const rec of recommendations) {
        const citations = await query<{
          id: string;
          ingredient_name: string;
          citation_text: string;
          source_url?: string;
          compliance_record_id?: string;
          created_at: string;
        }>(
          `SELECT 
            id, ingredient_name, citation_text, source_url, compliance_record_id, created_at
          FROM recommendation_citations
          WHERE recommendation_id = $1`,
          [rec.id]
        );

        rec.citations = citations.map((c) => ({
          id: c.id,
          recommendation_id: rec.id,
          ingredient_name: c.ingredient_name,
          citation_text: c.citation_text,
          source_url: c.source_url || undefined,
          compliance_record_id: c.compliance_record_id || undefined,
          created_at: c.created_at,
        }));
      }

      res.json({
        data: {
          items: recommendations,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch recommendations',
        },
      });
    }
  }
);

/**
 * GET /api/copilot/recommendations/:id
 * Get specific recommendation with full details
 */
router.get(
  '/recommendations/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<CopilotRecommendation>>) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const recommendations = await query<CopilotRecommendation>(
        `SELECT 
          id, user_id, workout_id, recommendation_text, reasoning, created_at
        FROM copilot_recommendations
        WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (recommendations.length === 0) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Recommendation not found',
          },
        });
        return;
      }

      const recommendation = recommendations[0];

      // Fetch citations
      const citations = await query<{
        id: string;
        ingredient_name: string;
        citation_text: string;
        source_url?: string;
        compliance_record_id?: string;
        created_at: string;
      }>(
        `SELECT 
          id, ingredient_name, citation_text, source_url, compliance_record_id, created_at
        FROM recommendation_citations
        WHERE recommendation_id = $1`,
        [recommendation.id]
      );

      recommendation.citations = citations.map((c) => ({
        id: c.id,
        recommendation_id: recommendation.id,
        ingredient_name: c.ingredient_name,
        citation_text: c.citation_text,
        source_url: c.source_url || undefined,
        compliance_record_id: c.compliance_record_id || undefined,
        created_at: c.created_at,
      }));

      res.json({ data: recommendation });
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch recommendation',
        },
      });
    }
  }
);

export default router;

