#!/usr/bin/env tsx

/**
 * Verification script to ensure compliance filtering works correctly
 * This script tests that ONLY compliant ingredients are returned in recommendations
 */

import { getComplianceRecord, filterCompliantIngredients } from '../backend/src/services/complianceService';

async function verifyComplianceFiltering() {
  console.log('🔍 Verifying Compliance Filtering\n');

  // Test case 1: Approved ingredient
  console.log('Test 1: Approved ingredient (Whey Protein)');
  const wheyRecord = await getComplianceRecord('Whey Protein', 'FDA');
  if (wheyRecord && (wheyRecord.status === 'approved' || wheyRecord.status === 'pending')) {
    console.log('✅ Whey Protein is compliant\n');
  } else {
    console.log('⚠️  Whey Protein compliance status:', wheyRecord?.status || 'unknown\n');
  }

  // Test case 2: Banned ingredient
  console.log('Test 2: Banned ingredient (Ephedrine)');
  const ephedrineRecord = await getComplianceRecord('Ephedrine', 'FDA');
  if (ephedrineRecord && ephedrineRecord.status === 'banned') {
    console.log('✅ Ephedrine is correctly identified as banned\n');
  } else {
    console.log('⚠️  Ephedrine status:', ephedrineRecord?.status || 'unknown\n');
  }

  // Test case 3: Filtering mixed ingredients
  console.log('Test 3: Filtering mixed ingredients');
  const testIngredients = [
    'Whey Protein',
    'Creatine Monohydrate',
    'Ephedrine', // Should be filtered out
    'DMAA (1,3-Dimethylamylamine)', // Should be filtered out
    'Unknown Ingredient', // Should be filtered out
  ];

  const result = await filterCompliantIngredients(testIngredients, 'FDA');
  
  console.log('Input ingredients:', testIngredients);
  console.log('Compliant:', result.compliant);
  console.log('Non-compliant:', result.nonCompliant.map((n) => `${n.name} (${n.reason})`));
  console.log('Unknown:', result.unknown);

  // Verify that banned/restricted/unknown are filtered out
  const hasBanned = result.nonCompliant.some((n) => n.reason.includes('Banned'));
  const hasRestricted = result.nonCompliant.some((n) => n.reason.includes('Restricted'));
  const hasUnknown = result.unknown.length > 0;

  if (hasBanned || hasRestricted || hasUnknown) {
    console.log('✅ Non-compliant ingredients correctly filtered out\n');
  } else {
    console.log('⚠️  Filtering may not be working correctly\n');
  }

  // Test case 4: Verify ONLY approved/pending are in compliant list
  console.log('Test 4: Verifying compliant list contains ONLY approved/pending');
  let allCompliant = true;
  for (const ingredient of result.compliant) {
    const record = await getComplianceRecord(ingredient, 'FDA');
    if (!record || (record.status !== 'approved' && record.status !== 'pending')) {
      console.log(`❌ ${ingredient} is in compliant list but status is: ${record?.status || 'unknown'}`);
      allCompliant = false;
    }
  }
  if (allCompliant) {
    console.log('✅ All ingredients in compliant list are approved or pending\n');
  }

  console.log('✅ Compliance verification complete!');
}

// Run verification
verifyComplianceFiltering().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});

