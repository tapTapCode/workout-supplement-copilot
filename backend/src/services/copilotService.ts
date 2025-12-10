import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, END, START } from '@langchain/langgraph';
import { query, transaction } from '../db/connection';
import { getComplianceRecord, filterCompliantIngredients } from './complianceService';
import { getWorkoutById } from './workoutService';
import { validateRecommendationCompliance } from './validationService';
import type {
  CopilotRecommendation,
  CopilotRecommendRequest,
  ComplianceRecord,
  Workout,
  Exercise,
} from '@workout-copilot/shared';

// Initialize LLM
const llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// LangGraph State Interface
interface CopilotState {
  // Input
  user_id: string;
  workout_id?: string;
  user_goals?: string[];
  health_conditions?: string[];

  // Context
  workout?: Workout;
  candidate_supplements?: Array<{
    name: string;
    category: string;
    ingredients: string[];
    reason: string;
  }>;

  // Processing
  compliance_checks?: Array<{
    ingredient: string;
    compliant: boolean;
    record: ComplianceRecord | null;
  }>;
  filtered_supplements?: Array<{
    name: string;
    category: string;
    ingredients: string[];
    reason: string;
  }>;

  // Output
  recommendation_text?: string;
  reasoning?: string;
  citations?: Array<{
    ingredient: string;
    citation_text: string;
    source_url?: string;
    record_id?: string;
  }>;
  errors?: string[];
  warnings?: string[];
}

/**
 * Step 1: Gather context (workout details, user profile)
 */
async function gatherContext(state: CopilotState): Promise<Partial<CopilotState>> {
  const context: Partial<CopilotState> = {};

  // Fetch workout if provided
  if (state.workout_id) {
    const workout = await getWorkoutById(state.workout_id, state.user_id);
    if (workout) {
      context.workout = workout;
    }
  }

  return context;
}

/**
 * Step 2: Generate supplement candidates using LLM
 */
async function generateCandidates(state: CopilotState): Promise<Partial<CopilotState>> {
  if (!state.workout && !state.user_goals?.length) {
    return {
      errors: ['Either workout_id or user_goals must be provided'],
    };
  }

  const workoutDetails = state.workout
    ? `Workout: ${state.workout.name}\n${
        state.workout.description ? `Description: ${state.workout.description}\n` : ''
      }Exercises: ${state.workout.exercises?.map((e: Exercise) => e.name).join(', ') || 'None'}\n${
        state.workout.exercises
          ? `Muscle Groups: ${state.workout.exercises
              .flatMap((e: Exercise) => e.muscle_groups || [])
              .filter((g: string, i: number, arr: string[]) => arr.indexOf(g) === i)
              .join(', ')}`
          : ''
      }`
    : 'No specific workout provided';

  const prompt = `You are a fitness and nutrition expert. Analyze the following workout and user profile to recommend appropriate supplements.

${workoutDetails}

User Goals: ${state.user_goals?.join(', ') || 'General fitness'}
Health Conditions: ${state.health_conditions?.join(', ') || 'None'}

Based on this information, recommend 3-5 supplements that would support the user's fitness goals. For each supplement, provide:
1. Supplement name and category (e.g., "Whey Protein", "protein")
2. Primary benefit for this specific workout
3. Key ingredients (list 2-4 main ingredients)

IMPORTANT: Use only well-known, commonly FDA-approved ingredients. Examples of safe ingredients to use:
- Whey Protein, Casein Protein, Plant Protein
- Creatine Monohydrate
- Caffeine
- Beta-Alanine
- BCAA (Branched-Chain Amino Acids)
- L-Carnitine
- Glutamine
- Vitamin D3, Vitamin B12, Multivitamins
- Omega-3 Fatty Acids
- Magnesium, Zinc, Iron

Avoid using obscure or proprietary ingredient names. Use the standard, common names for ingredients that are widely recognized and FDA-approved.

Only recommend supplements that are safe and appropriate for the user's health conditions.

Respond in JSON format:
{
  "supplements": [
    {
      "name": "Supplement Name",
      "category": "category",
      "ingredients": ["ingredient1", "ingredient2"],
      "reason": "Why this supplement helps"
    }
  ]
}`;

  try {
    const response = await llm.invoke(prompt);
    const content = response.content as string;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { errors: ['Failed to parse LLM response'] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      candidate_supplements: parsed.supplements || [],
    };
  } catch (error) {
    console.error('Error generating candidates:', error);
    return {
      errors: [`Error generating recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Step 3: Check compliance for all ingredients
 */
async function checkCompliance(state: CopilotState): Promise<Partial<CopilotState>> {
  if (!state.candidate_supplements) {
    return {};
  }

  const allIngredients = new Set<string>();
  state.candidate_supplements.forEach((supp) => {
    supp.ingredients.forEach((ing) => allIngredients.add(ing));
  });

  const complianceChecks = await Promise.all(
    Array.from(allIngredients).map(async (ingredient) => {
      const record = await getComplianceRecord(ingredient, 'FDA');
      return {
        ingredient,
        compliant: record ? (record.status === 'approved' || record.status === 'pending') : false,
        record,
      };
    })
  );

  // Filter out supplements with banned, restricted, or unknown ingredients
  // Only allow supplements with ALL ingredients having approved or pending status
  const filteredSupplements = state.candidate_supplements.filter((supp) => {
    // Check that ALL ingredients are either approved or pending
    const allIngredientsCompliant = supp.ingredients.every((ing) => {
      const check = complianceChecks.find((c) => c.ingredient === ing);
      
      // If no record found, ingredient is unknown - reject
      if (!check?.record) {
        return false;
      }
      
      // Only allow approved or pending status
      return check.record.status === 'approved' || check.record.status === 'pending';
    });
    
    return allIngredientsCompliant;
  });

  // Add warnings for filtered out supplements
  const filteredOut = state.candidate_supplements.filter((supp) => !filteredSupplements.includes(supp));
  
  // Analyze why supplements were filtered out
  const filteredOutReasons = {
    banned: 0,
    restricted: 0,
    unknown: 0,
  };

  filteredOut.forEach((supp) => {
    const hasBanned = supp.ingredients.some((ing) => {
      const check = complianceChecks.find((c) => c.ingredient === ing);
      return check?.record?.status === 'banned';
    });
    const hasRestricted = supp.ingredients.some((ing) => {
      const check = complianceChecks.find((c) => c.ingredient === ing);
      return check?.record?.status === 'restricted';
    });
    const hasUnknown = supp.ingredients.some((ing) => {
      const check = complianceChecks.find((c) => c.ingredient === ing);
      return !check?.record;
    });

    if (hasBanned) filteredOutReasons.banned++;
    if (hasRestricted) filteredOutReasons.restricted++;
    if (hasUnknown) filteredOutReasons.unknown++;
  });

  const warnings: string[] = [];
  if (filteredOut.length > 0) {
    const reasons: string[] = [];
    if (filteredOutReasons.banned > 0) {
      reasons.push(`${filteredOutReasons.banned} with banned ingredients`);
    }
    if (filteredOutReasons.restricted > 0) {
      reasons.push(`${filteredOutReasons.restricted} with restricted ingredients`);
    }
    if (filteredOutReasons.unknown > 0) {
      reasons.push(`${filteredOutReasons.unknown} with unknown compliance status`);
    }
    warnings.push(
      `${filteredOut.length} supplement(s) were filtered out: ${reasons.join(', ')}. Only supplements with FDA-approved or pending ingredients are recommended.`
    );
  }

  // If no supplements passed filtering, set an error
  if (filteredSupplements.length === 0) {
    return {
      compliance_checks: complianceChecks,
      filtered_supplements: [],
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: [
        'No FDA-compliant supplements found. All candidate supplements contained banned, restricted, or unknown ingredients. Only supplements with FDA-approved or pending ingredients are recommended. Please try with different workout goals or consult with a healthcare provider.',
      ],
    };
  }

  return {
    compliance_checks: complianceChecks,
    filtered_supplements: filteredSupplements,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Step 4: Generate reasoning and citations
 */
async function generateReasoningAndCitations(
  state: CopilotState
): Promise<Partial<CopilotState>> {
  if (!state.filtered_supplements || state.filtered_supplements.length === 0) {
    return {
      errors: [
        'No compliant supplements found after filtering. All candidate supplements contained non-compliant, restricted, or unknown ingredients. Please try with different workout goals or consult with a healthcare provider.',
      ],
    };
  }

  const supplementsText = state.filtered_supplements
    .map(
      (s) =>
        `- ${s.name} (${s.category}): ${s.reason}\n  Ingredients: ${s.ingredients.join(', ')}`
    )
    .join('\n');

  const prompt = `Explain why each of these supplements is recommended for this specific workout:

Supplements:
${supplementsText}

Workout: ${state.workout?.name || 'General fitness'}

For each supplement, provide:
1. How it supports the workout goals
2. When to take it (pre/post/during workout)
3. Expected benefits
4. Any precautions or considerations

Be specific and link each recommendation to the workout's muscle groups and intensity.

Format your response as:
RECOMMENDATION: [overall recommendation text]
REASONING: [detailed reasoning for each supplement]`;

  try {
    const response = await llm.invoke(prompt);
    const content = response.content as string;

    const recommendationMatch = content.match(/RECOMMENDATION:\s*(.+?)(?=REASONING:|$)/s);
    const reasoningMatch = content.match(/REASONING:\s*(.+?)$/s);

    // Generate citations for ALL ingredients in the filtered supplements
    // This ensures every ingredient in the final recommendation has a citation
    const citations: Array<{
      ingredient: string;
      citation_text: string;
      source_url?: string;
      record_id?: string;
    }> = [];

    // Get all unique ingredients from filtered supplements
    const recommendationIngredients = new Set<string>();
    state.filtered_supplements.forEach((supp) => {
      supp.ingredients.forEach((ing) => recommendationIngredients.add(ing));
    });

    // Generate citations for each ingredient in the recommendation
    for (const ingredient of recommendationIngredients) {
      const check = state.compliance_checks?.find((c) => c.ingredient === ingredient);
      if (check?.record) {
        citations.push({
          ingredient: check.ingredient,
          citation_text: `${check.record.source_authority}: ${check.record.status}${
            check.record.fda_status ? ` - ${check.record.fda_status}` : ''
          }${check.record.notes ? ` (${check.record.notes})` : ''}`,
          source_url: check.record.source_url || undefined,
          record_id: check.record.id,
        });
      } else {
        // Unknown ingredient - still create citation but mark as requiring verification
        citations.push({
          ingredient: ingredient,
          citation_text: `Status: Unknown - This ingredient requires manual FDA compliance verification. Please consult with a healthcare provider before use.`,
        });
      }
    }

    const recommendationText = recommendationMatch?.[1]?.trim() || content.split('REASONING:')[0].replace('RECOMMENDATION:', '').trim() || content;
    const reasoningText = reasoningMatch?.[1]?.trim() || content.split('REASONING:')[1]?.trim() || content.split('RECOMMENDATION:')[1]?.trim() || content;
    
    // Ensure we have both recommendation and reasoning
    if (!recommendationText || !reasoningText) {
      return {
        errors: ['Failed to extract recommendation text or reasoning from LLM response'],
      };
    }
    
    return {
      recommendation_text: recommendationText,
      reasoning: reasoningText,
      citations,
    };
  } catch (error) {
    console.error('Error generating reasoning:', error);
    return {
      errors: [`Error generating reasoning: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Step 5: Final validation - ensure ONLY approved or pending ingredients
 * All supplements should already be filtered, but this is a final safety check
 */
async function validateFinalRecommendation(state: CopilotState): Promise<Partial<CopilotState>> {
  // This check should not be needed due to conditional edge, but keep as safety
  if (!state.filtered_supplements || state.filtered_supplements.length === 0) {
    return { 
      errors: ['No supplements to validate. All supplements were filtered out due to compliance issues.'] 
    };
  }

  // Extract all ingredients from filtered supplements
  const allIngredients = new Set<string>();
  state.filtered_supplements.forEach((supp) => {
    supp.ingredients.forEach((ing) => allIngredients.add(ing));
  });

  // Final validation check - flags banned, restricted, and unknown ingredients
  const validation = await validateRecommendationCompliance(
    Array.from(allIngredients),
    'FDA'
  );

  if (!validation.valid) {
    // Fail if we have any violations (banned, restricted, or unknown)
    const violations = validation.violations;
    
    if (violations.length > 0) {
      return {
        errors: [
          `Validation failed: Found non-compliant ingredients: ${violations
            .map((v) => `${v.ingredient} (${v.status})`)
            .join(', ')}. Only FDA-approved or pending ingredients are allowed.`,
        ],
      };
    }
  }

  // Double-check that all ingredients have compliance records with approved/pending status
  for (const ingredient of allIngredients) {
    const check = state.compliance_checks?.find((c) => c.ingredient === ingredient);
    if (!check?.record) {
      return {
        errors: [
          `Validation failed: Ingredient "${ingredient}" has unknown compliance status. Only FDA-approved or pending ingredients are allowed.`,
        ],
      };
    }
    if (check.record.status !== 'approved' && check.record.status !== 'pending') {
      return {
        errors: [
          `Validation failed: Ingredient "${ingredient}" has status "${check.record.status}". Only FDA-approved or pending ingredients are allowed.`,
        ],
      };
    }
  }

  return {};
}

/**
 * Step 6: Save recommendation to database
 */
async function saveRecommendation(state: CopilotState): Promise<Partial<CopilotState>> {
  if (!state.recommendation_text || !state.reasoning) {
    return { errors: ['Missing recommendation text or reasoning'] };
  }

  try {
    const result = await transaction(async (client) => {
      // Create recommendation
      const recResult = await client.query<CopilotRecommendation>(
        `INSERT INTO copilot_recommendations (
          user_id, workout_id, recommendation_text, reasoning
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, workout_id, recommendation_text, reasoning, created_at`,
        [
          state.user_id,
          state.workout_id || null,
          state.recommendation_text,
          state.reasoning,
        ]
      );

      const recommendation = recResult.rows[0];

      // Save citations
      if (state.citations) {
        for (const citation of state.citations) {
          await client.query(
            `INSERT INTO recommendation_citations (
              recommendation_id, ingredient_name, compliance_record_id, citation_text, source_url
            )
            VALUES ($1, $2, $3, $4, $5)`,
            [
              recommendation.id,
              citation.ingredient,
              citation.record_id || null,
              citation.citation_text,
              citation.source_url || null,
            ]
          );
        }
      }

      return recommendation;
    });

    return {};
  } catch (error) {
    console.error('Error saving recommendation:', error);
    return {
      errors: [`Error saving recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

// Build LangGraph workflow with proper state management
// Using a simpler approach that merges state updates
const workflow = new StateGraph<CopilotState>({
  channels: {
    user_id: { reducer: (x, y) => y ?? x },
    workout_id: { reducer: (x, y) => y ?? x },
    user_goals: { reducer: (x, y) => y ?? x },
    health_conditions: { reducer: (x, y) => y ?? x },
    workout: { reducer: (x, y) => y ?? x },
    candidate_supplements: { reducer: (x, y) => y ?? x },
    compliance_checks: { reducer: (x, y) => y ?? x },
    filtered_supplements: { reducer: (x, y) => y ?? x },
    recommendation_text: { reducer: (x, y) => y ?? x },
    reasoning: { reducer: (x, y) => y ?? x },
    citations: { reducer: (x, y) => y ?? x },
    errors: { reducer: (x, y) => [...(x || []), ...(y || [])] },
    warnings: { reducer: (x, y) => [...(x || []), ...(y || [])] },
  },
})
  .addNode('gatherContext', gatherContext)
  .addNode('generateCandidates', generateCandidates)
  .addNode('checkCompliance', checkCompliance)
  .addNode('generateReasoning', generateReasoningAndCitations)
  .addNode('validateFinal', validateFinalRecommendation)
  .addNode('saveRecommendation', saveRecommendation)
  .addEdge(START, 'gatherContext')
  .addEdge('gatherContext', 'generateCandidates')
  .addEdge('generateCandidates', 'checkCompliance')
  .addConditionalEdges('checkCompliance', (state: CopilotState) => {
    // If no supplements passed filtering or there are errors, skip to END
    if (state.errors && state.errors.length > 0) {
      return 'END';
    }
    if (!state.filtered_supplements || state.filtered_supplements.length === 0) {
      return 'END';
    }
    return 'generateReasoning';
  })
  .addEdge('generateReasoning', 'validateFinal')
  .addEdge('validateFinal', 'saveRecommendation')
  .addEdge('saveRecommendation', END);

const app = workflow.compile();

/**
 * Get supplement recommendation
 */
export async function getRecommendation(
  userId: string,
  request: CopilotRecommendRequest
): Promise<CopilotRecommendation> {
  const initialState: CopilotState = {
    user_id: userId,
    workout_id: request.workout_id,
    user_goals: request.user_goals,
    health_conditions: request.health_conditions,
  };

  const result = await app.invoke(initialState);

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors.join('; '));
  }

  // Fetch the saved recommendation with citations
  const recommendations = await query<CopilotRecommendation>(
    `SELECT 
      id, user_id, workout_id, recommendation_text, reasoning, created_at
    FROM copilot_recommendations
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1`,
    [userId]
  );

  if (recommendations.length === 0) {
    throw new Error('Failed to retrieve saved recommendation');
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

  return {
    ...recommendation,
    citations: citations.map((c) => ({
      id: c.id,
      recommendation_id: recommendation.id,
      ingredient_name: c.ingredient_name,
      citation_text: c.citation_text,
      source_url: c.source_url || undefined,
      compliance_record_id: c.compliance_record_id || undefined,
      created_at: c.created_at,
    })),
  };
}

