import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getComplianceRecord, normalizeIngredientName } from '../../services/complianceService';
import { query } from '../../db/connection';
import type { ComplianceRecord } from '@workout-copilot/shared';

// Mock the database connection
jest.mock('../../db/connection');

describe('ComplianceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeIngredientName', () => {
    it('should normalize whey protein variations', () => {
      expect(normalizeIngredientName('Whey Protein Concentrate')).toBe('whey protein');
      expect(normalizeIngredientName('Whey Protein Isolate')).toBe('whey protein');
    });

    it('should normalize creatine variations', () => {
      expect(normalizeIngredientName('Creatine Monohydrate')).toBe('creatine monohydrate');
    });

    it('should normalize BCAA variations', () => {
      expect(normalizeIngredientName('Branched-Chain Amino Acids')).toBe('bcaa');
      expect(normalizeIngredientName('BCAA')).toBe('bcaa');
    });

    it('should normalize vitamin variations', () => {
      expect(normalizeIngredientName('Vitamin D3')).toBe('vitamin d3');
      expect(normalizeIngredientName('Vitamin B12')).toBe('vitamin b12');
    });

    it('should handle case-insensitive normalization', () => {
      expect(normalizeIngredientName('WHEY PROTEIN')).toBe('whey protein');
      expect(normalizeIngredientName('Creatine')).toBe('creatine monohydrate');
    });
  });

  describe('getComplianceRecord', () => {
    it('should return compliance record for exact match', async () => {
      (query as jest.MockedFunction<typeof query>).mockResolvedValue([
        {
          id: '1',
          ingredient_name: 'Whey Protein',
          status: 'approved',
          source_authority: 'FDA',
          fda_status: 'GRAS',
          source_url: 'https://fda.gov/...',
          last_verified_at: new Date().toISOString(),
          notes: 'Generally Recognized as Safe',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const result = await getComplianceRecord('Whey Protein', 'FDA');

      expect(result).toBeTruthy();
      expect(result?.ingredient_name).toBe('Whey Protein');
      expect(result?.status).toBe('approved');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(ingredient_name) = LOWER'),
        ['Whey Protein', 'FDA']
      );
    });

    it('should return null if no record found', async () => {
      (query as jest.MockedFunction<typeof query>).mockResolvedValue([]);

      const result = await getComplianceRecord('Unknown Ingredient', 'FDA');

      expect(result).toBeNull();
    });

    it('should handle case-insensitive matching', async () => {
      (query as jest.MockedFunction<typeof query>)
        .mockResolvedValueOnce([] as ComplianceRecord[]) // First call (exact match)
        .mockResolvedValueOnce([
          {
            id: '1',
            ingredient_name: 'creatine monohydrate',
            status: 'approved',
            source_authority: 'FDA',
          },
        ] as ComplianceRecord[]); // Second call (normalized match)

      const result = await getComplianceRecord('Creatine Monohydrate', 'FDA');

      expect(result).toBeTruthy();
      expect(query).toHaveBeenCalledTimes(2);
    });

    it('should try partial match if normalized match fails', async () => {
      (query as jest.MockedFunction<typeof query>)
        .mockResolvedValueOnce([] as ComplianceRecord[]) // Exact match
        .mockResolvedValueOnce([] as ComplianceRecord[]) // Normalized match
        .mockResolvedValueOnce([
          {
            id: '1',
            ingredient_name: 'Beta-Alanine',
            status: 'approved',
            source_authority: 'FDA',
          },
        ] as ComplianceRecord[]); // Partial match

      const result = await getComplianceRecord('Beta Alanine', 'FDA');

      expect(result).toBeTruthy();
      expect(query).toHaveBeenCalledTimes(3);
    });
  });
});

