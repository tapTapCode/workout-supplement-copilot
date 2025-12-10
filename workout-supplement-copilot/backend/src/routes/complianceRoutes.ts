import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getComplianceRecord, getComplianceRecords, upsertComplianceRecord } from '../services/complianceService';
import type {
  ComplianceRecord,
  ApiResponse,
  ComplianceStatus,
} from '@workout-copilot/shared';
import { z } from 'zod';

const router = Router();

const verifySchema = z.object({
  ingredient_name: z.string().min(1),
  status: z.enum(['approved', 'pending', 'restricted', 'banned', 'unknown']),
  source_authority: z.string().min(1),
  source_url: z.string().url().optional(),
  fda_status: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/compliance/ingredient/:name
 * Check compliance status for an ingredient
 */
router.get(
  '/ingredient/:name',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<{ ingredient: string; status: string; records: ComplianceRecord[] }>>) => {
    try {
      const { name } = req.params;
      const sourceAuthority = (req.query.authority as string) || 'FDA';

      // Get all compliance records for this ingredient
      const records = await getComplianceRecords(name);

      // Filter by authority if specified
      const filteredRecords = sourceAuthority === 'all'
        ? records
        : records.filter((r) => r.source_authority === sourceAuthority);

      // Determine overall status (most restrictive)
      let overallStatus: ComplianceStatus = 'unknown';
      if (filteredRecords.length > 0) {
        const statuses = filteredRecords.map((r) => r.status);
        if (statuses.includes('banned')) {
          overallStatus = 'banned';
        } else if (statuses.includes('restricted')) {
          overallStatus = 'restricted';
        } else if (statuses.includes('approved')) {
          overallStatus = 'approved';
        } else if (statuses.includes('pending')) {
          overallStatus = 'pending';
        }
      }

      res.json({
        data: {
          ingredient: name,
          status: overallStatus,
          records: filteredRecords,
        },
      });
    } catch (error) {
      console.error('Error fetching compliance:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch compliance information',
        },
      });
    }
  }
);

/**
 * POST /api/compliance/verify
 * Verify/update compliance record (admin only - for now, any authenticated user)
 * TODO: Add admin role check
 */
router.post(
  '/verify',
  authenticateToken,
  async (req: AuthRequest, res: Response<ApiResponse<ComplianceRecord>>) => {
    try {
      const validationResult = verifySchema.safeParse(req.body);

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

      const record = await upsertComplianceRecord(
        validationResult.data.ingredient_name,
        validationResult.data.status,
        validationResult.data.source_authority,
        {
          fdaStatus: validationResult.data.fda_status,
          sourceUrl: validationResult.data.source_url,
          notes: validationResult.data.notes,
        }
      );

      res.json({ data: record });
    } catch (error) {
      console.error('Error verifying compliance:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify compliance record',
        },
      });
    }
  }
);

export default router;

