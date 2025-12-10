// User Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Workout Types
export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  muscle_groups: string[];
  equipment?: string;
  instructions?: string;
  order_index: number;
  created_at: string;
  sets?: ExerciseSet[];
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  order_index: number;
  created_at: string;
}

export interface WorkoutSchedule {
  id: string;
  workout_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  time_of_day?: string;
  is_active: boolean;
  created_at: string;
}

// Supplement Types
export interface Supplement {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  category: string;
  created_at: string;
  updated_at: string;
  ingredients?: SupplementIngredient[];
}

export interface SupplementIngredient {
  id: string;
  supplement_id: string;
  ingredient_name: string;
  amount?: string;
  order_index: number;
  created_at: string;
}

// Compliance Types
export type ComplianceStatus = 'approved' | 'pending' | 'restricted' | 'banned' | 'unknown';

export interface ComplianceRecord {
  id: string;
  ingredient_name: string;
  status: ComplianceStatus;
  fda_status?: string;
  source_url?: string;
  source_authority: string;
  last_verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Copilot Types
export interface CopilotRecommendation {
  id: string;
  user_id: string;
  workout_id?: string;
  recommendation_text: string;
  reasoning: string;
  created_at: string;
  supplements?: RecommendationSupplement[];
  citations?: RecommendationCitation[];
}

export interface RecommendationSupplement {
  id: string;
  recommendation_id: string;
  supplement_id: string;
  supplement?: Supplement;
  reason?: string;
}

export interface RecommendationCitation {
  id: string;
  recommendation_id: string;
  ingredient_name: string;
  compliance_record_id?: string;
  citation_text: string;
  source_url?: string;
  created_at: string;
  compliance_record?: ComplianceRecord;
}

// API Request/Response Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Request Types
export interface CreateWorkoutRequest {
  name: string;
  description?: string;
  exercises?: Omit<Exercise, 'id' | 'workout_id' | 'created_at'>[];
}

export interface UpdateWorkoutRequest {
  name?: string;
  description?: string;
  exercises?: Omit<Exercise, 'id' | 'workout_id' | 'created_at'>[];
}

export interface CopilotRecommendRequest {
  workout_id?: string;
  user_goals?: string[];
  health_conditions?: string[];
}
