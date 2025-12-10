import { getComplianceRecord } from './complianceService';
import type { ComplianceRecord } from '@workout-copilot/shared';

/**
 * Validate that a recommendation contains ONLY compliant ingredients
 * This is a final safety check before returning recommendations to users
 */
export async function validateRecommendationCompliance(
  ingredients: string[],
  sourceAuthority: string = 'FDA'
): Promise<{
  valid: boolean;
  violations: Array<{
    ingredient: string;
    status: string;
    reason: string;
  }>;
}> {
  const violations: Array<{
    ingredient: string;
    status: string;
    reason: string;
  }> = [];

  for (const ingredient of ingredients) {
    const record = await getComplianceRecord(ingredient, sourceAuthority);

    // Unknown ingredients are NOT allowed - flag as violation
    if (!record) {
      violations.push({
        ingredient,
        status: 'unknown',
        reason: 'No compliance record found - ingredient requires FDA verification before use',
      });
      continue;
    }

    if (record.status === 'banned') {
      violations.push({
        ingredient,
        status: 'banned',
        reason: `Banned by ${record.source_authority}: ${record.notes || 'No reason provided'}`,
      });
      continue;
    }

    if (record.status === 'restricted') {
      violations.push({
        ingredient,
        status: 'restricted',
        reason: `Restricted by ${record.source_authority}: ${record.notes || 'No reason provided'}`,
      });
      continue;
    }

    // Only flag non-approved/pending statuses that are explicitly problematic
    // Unknown is already handled above (allowed)
    // Approved and pending are allowed
    if (record.status !== 'approved' && record.status !== 'pending' && record.status !== 'unknown') {
      violations.push({
        ingredient,
        status: record.status,
        reason: `Status "${record.status}" is not compliant`,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Extract ingredients from recommendation text (fallback method)
 * This is used if ingredients aren't explicitly provided
 */
export function extractIngredientsFromText(text: string): string[] {
  // Simple extraction - in production, this could use NLP
  const commonIngredients = [
    'Whey Protein',
    'Creatine',
    'Caffeine',
    'Beta-Alanine',
    'BCAA',
    'L-Glutamine',
    'Ephedrine',
    'DMAA',
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  for (const ingredient of commonIngredients) {
    if (lowerText.includes(ingredient.toLowerCase())) {
      found.push(ingredient);
    }
  }

  return found;
}

