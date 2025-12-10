import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { validateRecommendationCompliance, extractIngredientsFromText } from '../../services/validationService';
import { getComplianceRecord } from '../../services/complianceService';
import type { ComplianceRecord } from '@workout-copilot/shared';

// Mock the compliance service
jest.mock('../../services/complianceService');

describe('ValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRecommendationCompliance', () => {
    it('should return valid for approved ingredients', async () => {
      (getComplianceRecord as jest.MockedFunction<typeof getComplianceRecord>).mockResolvedValue({
        id: '1',
        ingredient_name: 'Whey Protein',
        status: 'approved',
        source_authority: 'FDA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ComplianceRecord);

      const result = await validateRecommendationCompliance(['Whey Protein']);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should return valid for pending ingredients', async () => {
      (getComplianceRecord as jest.MockedFunction<typeof getComplianceRecord>).mockResolvedValue({
        id: '1',
        ingredient_name: 'New Ingredient',
        status: 'pending',
        source_authority: 'FDA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ComplianceRecord);

      const result = await validateRecommendationCompliance(['New Ingredient']);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should return invalid for banned ingredients', async () => {
      (getComplianceRecord as jest.MockedFunction<typeof getComplianceRecord>).mockResolvedValue({
        id: '1',
        ingredient_name: 'Ephedrine',
        status: 'banned',
        source_authority: 'FDA',
        notes: 'Banned substance',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ComplianceRecord);

      const result = await validateRecommendationCompliance(['Ephedrine']);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].status).toBe('banned');
      expect(result.violations[0].reason).toContain('Banned by FDA');
    });

    it('should return invalid for restricted ingredients', async () => {
      (getComplianceRecord as jest.MockedFunction<typeof getComplianceRecord>).mockResolvedValue({
        id: '1',
        ingredient_name: 'DMAA',
        status: 'restricted',
        source_authority: 'FDA',
        notes: 'Restricted use',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ComplianceRecord);

      const result = await validateRecommendationCompliance(['DMAA']);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].status).toBe('restricted');
    });

    it('should return invalid for unknown ingredients', async () => {
      (getComplianceRecord as jest.MockedFunction<typeof getComplianceRecord>).mockResolvedValue(null);

      const result = await validateRecommendationCompliance(['Unknown Ingredient']);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].status).toBe('unknown');
      expect(result.violations[0].reason).toContain('No compliance record found');
    });

    it('should validate multiple ingredients', async () => {
      (getComplianceRecord as jest.MockedFunction<typeof getComplianceRecord>)
        .mockResolvedValueOnce({
          id: '1',
          ingredient_name: 'Whey Protein',
          status: 'approved',
          source_authority: 'FDA',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as ComplianceRecord)
        .mockResolvedValueOnce({
          id: '2',
          ingredient_name: 'Creatine',
          status: 'approved',
          source_authority: 'FDA',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as ComplianceRecord)
        .mockResolvedValueOnce(null); // Unknown ingredient

      const result = await validateRecommendationCompliance([
        'Whey Protein',
        'Creatine',
        'Unknown',
      ]);

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ingredient).toBe('Unknown');
    });
  });

  describe('extractIngredientsFromText', () => {
    it('should extract common ingredients from text', () => {
      const text = 'This supplement contains Whey Protein and Creatine for muscle growth.';
      const ingredients = extractIngredientsFromText(text);

      expect(ingredients).toContain('Whey Protein');
      expect(ingredients).toContain('Creatine');
    });

    it('should return empty array if no ingredients found', () => {
      const text = 'This is just regular text with no ingredients.';
      const ingredients = extractIngredientsFromText(text);

      expect(ingredients).toHaveLength(0);
    });

    it('should handle case-insensitive matching', () => {
      const text = 'Contains WHEY PROTEIN and caffeine.';
      const ingredients = extractIngredientsFromText(text);

      expect(ingredients).toContain('Whey Protein');
      expect(ingredients).toContain('Caffeine');
    });
  });
});

