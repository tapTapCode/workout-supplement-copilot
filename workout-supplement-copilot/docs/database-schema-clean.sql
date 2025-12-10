-- Workout & Supplement Copilot Database Schema
-- For Supabase PostgreSQL
-- Ready to paste into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workouts (using BIGSERIAL for id)
CREATE TABLE IF NOT EXISTS workouts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id BIGINT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  equipment VARCHAR(100),
  instructions TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise Sets
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL(10,2),
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout Schedules
CREATE TABLE IF NOT EXISTS workout_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id BIGINT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_of_day TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_id, user_id, day_of_week)
);

-- Supplements Database
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  brand VARCHAR(255),
  description TEXT,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplement Ingredients
CREATE TABLE IF NOT EXISTS supplement_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  amount VARCHAR(100),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Records (FDA/Regulatory Status)
-- Drop table if it exists with wrong type, then recreate
DROP TABLE IF EXISTS recommendation_citations CASCADE;
DROP TABLE IF EXISTS compliance_records CASCADE;

CREATE TABLE compliance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('approved', 'pending', 'restricted', 'banned', 'unknown')),
  fda_status TEXT,
  source_url TEXT,
  source_authority VARCHAR(100) NOT NULL,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ingredient_name, source_authority)
);

-- Copilot Recommendations
CREATE TABLE IF NOT EXISTS copilot_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id BIGINT REFERENCES workouts(id) ON DELETE SET NULL,
  recommendation_text TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation Supplements (Many-to-Many)
CREATE TABLE IF NOT EXISTS recommendation_supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID NOT NULL REFERENCES copilot_recommendations(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recommendation_id, supplement_id)
);

-- Recommendation Citations
-- Note: Dropped above if it existed with wrong foreign key type
CREATE TABLE recommendation_citations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID NOT NULL REFERENCES copilot_recommendations(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  compliance_record_id UUID REFERENCES compliance_records(id) ON DELETE SET NULL,
  citation_text TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_created_at ON workouts(created_at);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_schedules_workout_id ON workout_schedules(workout_id);
CREATE INDEX IF NOT EXISTS idx_supplement_ingredients_supplement_id ON supplement_ingredients(supplement_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_ingredient_name ON compliance_records(ingredient_name);
CREATE INDEX IF NOT EXISTS idx_compliance_records_status ON compliance_records(status);
CREATE INDEX IF NOT EXISTS idx_supplements_category ON supplements(category);
CREATE INDEX IF NOT EXISTS idx_copilot_recommendations_user_id ON copilot_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_recommendations_workout_id ON copilot_recommendations(workout_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_supplements_recommendation_id ON recommendation_supplements(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_supplements_supplement_id ON recommendation_supplements(supplement_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_citations_recommendation_id ON recommendation_citations(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplements_updated_at BEFORE UPDATE ON supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON compliance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

