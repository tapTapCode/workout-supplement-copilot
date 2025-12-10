import { Router, Response } from 'express';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { query } from '../db/connection';
import type {
  Supplement,
  SupplementIngredient,
  ApiResponse,
  PaginatedResponse,
} from '@workout-copilot/shared';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/supplements
 * Search supplements
 */
router.get(
  '/',
  optionalAuth,
  async (req: AuthRequest, res: Response<ApiResponse<PaginatedResponse<Supplement>>>) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const searchQuery = (req.query.q as string)?.toLowerCase() || '';
      const category = req.query.category as string;

      let whereClause = '1=1';
      const params: unknown[] = [];
      let paramIndex = 1;

      if (searchQuery) {
        whereClause += ` AND (LOWER(s.name) LIKE $${paramIndex} OR LOWER(s.description) LIKE $${paramIndex})`;
        params.push(`%${searchQuery}%`);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND s.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM supplements s WHERE ${whereClause}`,
        params
      );
      const total = parseInt(countResult[0]?.count || '0', 10);

      // Get supplements
      params.push(limit, offset);
      const supplements = await query<Supplement>(
        `SELECT 
          s.id, s.name, s.brand, s.description, s.category, s.created_at, s.updated_at
        FROM supplements s
        WHERE ${whereClause}
        ORDER BY s.name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
      );

      // Get ingredients for each supplement
      for (const supplement of supplements) {
        const ingredients = await query<SupplementIngredient>(
          `SELECT 
            id, supplement_id, ingredient_name, amount, order_index, created_at
          FROM supplement_ingredients
          WHERE supplement_id = $1
          ORDER BY order_index ASC`,
          [supplement.id]
        );
        supplement.ingredients = ingredients;
      }

      res.json({
        data: {
          items: supplements,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching supplements:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch supplements',
        },
      });
    }
  }
);

/**
 * GET /api/supplements/:id
 * Get supplement details
 */
router.get(
  '/:id',
  optionalAuth,
  async (req: AuthRequest, res: Response<ApiResponse<Supplement>>) => {
    try {
      const { id } = req.params;

      const supplements = await query<Supplement>(
        `SELECT 
          s.id, s.name, s.brand, s.description, s.category, s.created_at, s.updated_at
        FROM supplements s
        WHERE s.id = $1`,
        [id]
      );

      if (supplements.length === 0) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Supplement not found',
          },
        });
        return;
      }

      const supplement = supplements[0];

      // Get ingredients
      const ingredients = await query<SupplementIngredient>(
        `SELECT 
          id, supplement_id, ingredient_name, amount, order_index, created_at
        FROM supplement_ingredients
        WHERE supplement_id = $1
        ORDER BY order_index ASC`,
        [supplement.id]
      );
      supplement.ingredients = ingredients;

      res.json({ data: supplement });
    } catch (error) {
      console.error('Error fetching supplement:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch supplement',
        },
      });
    }
  }
);

/**
 * GET /api/supplements/:id/compliance
 * Get compliance status for all ingredients in a supplement
 */
router.get(
  '/:id/compliance',
  optionalAuth,
  async (
    req: AuthRequest,
    res: Response<ApiResponse<{ supplement_id: string; ingredients: any[] }>>
  ) => {
    try {
      const { id } = req.params;

      // Get supplement
      const supplements = await query<Supplement>(
        'SELECT id FROM supplements WHERE id = $1',
        [id]
      );

      if (supplements.length === 0) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Supplement not found',
          },
        });
        return;
      }

      // Get ingredients
      const ingredients = await query<SupplementIngredient>(
        `SELECT ingredient_name
        FROM supplement_ingredients
        WHERE supplement_id = $1`,
        [id]
      );

      // Get compliance records for each ingredient
      const complianceData = await Promise.all(
        ingredients.map(async (ing) => {
          const records = await query<{
            id: string;
            ingredient_name: string;
            status: string;
            source_authority: string;
            source_url?: string;
          }>(
            `SELECT 
              id, ingredient_name, status, source_authority, source_url
            FROM compliance_records
            WHERE LOWER(ingredient_name) = LOWER($1)
            ORDER BY 
              CASE status
                WHEN 'approved' THEN 1
                WHEN 'pending' THEN 2
                WHEN 'restricted' THEN 3
                WHEN 'banned' THEN 4
                ELSE 5
              END
            LIMIT 1`,
            [ing.ingredient_name]
          );

          return {
            ingredient_name: ing.ingredient_name,
            compliance_status: records[0]?.status || 'unknown',
            compliance_record: records[0] || null,
          };
        })
      );

      res.json({
        data: {
          supplement_id: id,
          ingredients: complianceData,
        },
      });
    } catch (error) {
      console.error('Error fetching supplement compliance:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch supplement compliance',
        },
      });
    }
  }
);

export default router;

