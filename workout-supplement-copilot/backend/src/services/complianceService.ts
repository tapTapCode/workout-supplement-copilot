import { query } from '../db/connection';
import type { ComplianceRecord, ComplianceStatus } from '@workout-copilot/shared';

/**
 * Normalize ingredient name for matching (handles common variations)
 * Exported for testing
 */
export function normalizeIngredientName(name: string): string {
  // Convert to lowercase and remove extra spaces
  let normalized = name.toLowerCase().trim();
  
  // Handle common variations
  // "Whey protein concentrate" or "Whey protein isolate" -> "Whey Protein"
  if (normalized.includes('whey protein')) {
    return 'whey protein';
  }
  
  // "Creatine monohydrate" or "Creatine" -> "creatine monohydrate"
  if (normalized.includes('creatine monohydrate')) {
    return 'creatine monohydrate';
  }
  if (normalized === 'creatine') {
    return 'creatine monohydrate';
  }
  
  // "BCAA" variations
  if (normalized.includes('branched-chain amino acid') || normalized === 'bcaa') {
    return 'bcaa';
  }
  
  // "L-Carnitine" or "L Carnitine" -> "L-Carnitine"
  if (normalized.includes('carnitine')) {
    return normalized.replace(/\s+/g, '-').replace(/^l-?/, 'l-');
  }
  
  // "L-Glutamine" or "L Glutamine" -> "Glutamine"
  if (normalized.includes('glutamine')) {
    return 'glutamine';
  }
  
  // "Vitamin D3" -> "Vitamin D3"
  if (normalized.includes('vitamin d3') || normalized.includes('vitamin d')) {
    return 'vitamin d3';
  }
  
  // "Vitamin B12" -> "Vitamin B12"
  if (normalized.includes('vitamin b12') || normalized.includes('cobalamin')) {
    return 'vitamin b12';
  }
  
  // "Beta-Alanine" or "Beta Alanine" -> "Beta-Alanine"
  if (normalized.includes('beta alanine') || normalized.includes('beta-alanine')) {
    return 'beta-alanine';
  }
  
  // "Omega-3" variations
  if (normalized.includes('omega-3') || normalized.includes('omega 3')) {
    return 'omega-3';
  }
  
  // "EPA" -> "Eicosapentaenoic acid" (but we'll search for both)
  if (normalized === 'epa' || normalized.includes('eicosapentaenoic')) {
    return 'eicosapentaenoic acid';
  }
  
  // "DHA" -> "Docosahexaenoic acid"
  if (normalized === 'dha' || normalized.includes('docosahexaenoic')) {
    return 'docosahexaenoic acid';
  }
  
  // "Leucine", "Isoleucine", "Valine" -> keep as is but normalize
  if (normalized === 'leucine' || normalized === 'l-leucine') {
    return 'leucine';
  }
  if (normalized === 'isoleucine' || normalized === 'l-isoleucine') {
    return 'isoleucine';
  }
  if (normalized === 'valine' || normalized === 'l-valine') {
    return 'valine';
  }
  
  return normalized;
}

/**
 * Get compliance record for an ingredient
 * Tries exact match first, then normalized match, then partial match
 */
export async function getComplianceRecord(
  ingredientName: string,
  sourceAuthority: string = 'FDA'
): Promise<ComplianceRecord | null> {
  // Try exact match first (case-insensitive)
  let records = await query<ComplianceRecord>(
    `SELECT 
      id, ingredient_name, status, fda_status, source_url, 
      source_authority, last_verified_at, notes, created_at, updated_at
    FROM compliance_records
    WHERE LOWER(ingredient_name) = LOWER($1) AND source_authority = $2
    LIMIT 1`,
    [ingredientName, sourceAuthority]
  );

  if (records.length > 0) {
    return records[0];
  }

  // Try normalized match
  const normalized = normalizeIngredientName(ingredientName);
  records = await query<ComplianceRecord>(
    `SELECT 
      id, ingredient_name, status, fda_status, source_url, 
      source_authority, last_verified_at, notes, created_at, updated_at
    FROM compliance_records
    WHERE LOWER(ingredient_name) = $1 AND source_authority = $2
    LIMIT 1`,
    [normalized, sourceAuthority]
  );

  if (records.length > 0) {
    return records[0];
  }

  // Try partial match (ingredient name contains the normalized name or vice versa)
  records = await query<ComplianceRecord>(
    `SELECT 
      id, ingredient_name, status, fda_status, source_url, 
      source_authority, last_verified_at, notes, created_at, updated_at
    FROM compliance_records
    WHERE source_authority = $1
      AND (
        LOWER(ingredient_name) LIKE '%' || LOWER($2) || '%'
        OR LOWER($2) LIKE '%' || LOWER(ingredient_name) || '%'
      )
    ORDER BY 
      CASE 
        WHEN LOWER(ingredient_name) = LOWER($2) THEN 1
        WHEN LOWER(ingredient_name) LIKE LOWER($2) || '%' THEN 2
        ELSE 3
      END
    LIMIT 1`,
    [sourceAuthority, normalized]
  );

  return records.length > 0 ? records[0] : null;
}

/**
 * Get all compliance records for an ingredient (across all authorities)
 */
export async function getComplianceRecords(
  ingredientName: string
): Promise<ComplianceRecord[]> {
  return await query<ComplianceRecord>(
    `SELECT 
      id, ingredient_name, status, fda_status, source_url, 
      source_authority, last_verified_at, notes, created_at, updated_at
    FROM compliance_records
    WHERE LOWER(ingredient_name) = LOWER($1)
    ORDER BY 
      CASE status
        WHEN 'approved' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'restricted' THEN 3
        WHEN 'banned' THEN 4
        WHEN 'unknown' THEN 5
      END`,
    [ingredientName]
  );
}

/**
 * Check if ingredient is compliant (approved or pending)
 */
export async function isIngredientCompliant(
  ingredientName: string,
  sourceAuthority: string = 'FDA'
): Promise<{ compliant: boolean; record: ComplianceRecord | null }> {
  const record = await getComplianceRecord(ingredientName, sourceAuthority);
  
  if (!record) {
    return { compliant: false, record: null };
  }

  const compliant = record.status === 'approved' || record.status === 'pending';
  return { compliant, record };
}

/**
 * Filter out non-compliant ingredients from a list
 */
export async function filterCompliantIngredients(
  ingredientNames: string[],
  sourceAuthority: string = 'FDA'
): Promise<{
  compliant: string[];
  nonCompliant: Array<{ name: string; reason: string }>;
  unknown: string[];
}> {
  const compliant: string[] = [];
  const nonCompliant: Array<{ name: string; reason: string }> = [];
  const unknown: string[] = [];

  for (const ingredient of ingredientNames) {
    const record = await getComplianceRecord(ingredient, sourceAuthority);
    
    if (!record) {
      unknown.push(ingredient);
    } else if (record.status === 'banned') {
      nonCompliant.push({
        name: ingredient,
        reason: `Banned by ${record.source_authority}: ${record.notes || 'No reason provided'}`,
      });
    } else if (record.status === 'restricted') {
      nonCompliant.push({
        name: ingredient,
        reason: `Restricted by ${record.source_authority}: ${record.notes || 'No reason provided'}`,
      });
    } else if (record.status === 'approved' || record.status === 'pending') {
      compliant.push(ingredient);
    } else {
      unknown.push(ingredient);
    }
  }

  return { compliant, nonCompliant, unknown };
}

/**
 * Create or update a compliance record
 */
export async function upsertComplianceRecord(
  ingredientName: string,
  status: ComplianceStatus,
  sourceAuthority: string,
  options: {
    fdaStatus?: string;
    sourceUrl?: string;
    notes?: string;
  } = {}
): Promise<ComplianceRecord> {
  const records = await query<ComplianceRecord>(
    `INSERT INTO compliance_records (
      ingredient_name, status, fda_status, source_url, source_authority, notes, last_verified_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (ingredient_name, source_authority)
    DO UPDATE SET
      status = EXCLUDED.status,
      fda_status = EXCLUDED.fda_status,
      source_url = EXCLUDED.source_url,
      notes = EXCLUDED.notes,
      last_verified_at = NOW(),
      updated_at = NOW()
    RETURNING 
      id, ingredient_name, status, fda_status, source_url, 
      source_authority, last_verified_at, notes, created_at, updated_at`,
    [
      ingredientName,
      status,
      options.fdaStatus || null,
      options.sourceUrl || null,
      sourceAuthority,
      options.notes || null,
    ]
  );

  return records[0];
}

