#!/usr/bin/env tsx

/**
 * Seed script to populate database with dummy data for testing
 * 
 * Usage:
 *   export DATABASE_URL="your-database-url"
 *   tsx scripts/seed-dummy-data.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Load environment variables from backend/.env
const backendEnvPath = path.resolve(process.cwd(), 'backend/.env');
dotenv.config({ path: backendEnvPath });

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Transaction helper
async function transaction<T>(
  callback: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Demo user ID (in production, this would come from Supabase Auth)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_EMAIL = 'demo@example.com';

async function seedDummyData() {
  console.log('🌱 Starting to seed dummy data...\n');

  try {
    await transaction(async (client) => {
      // 1. Create demo user (if using Supabase, you'd need to create this in auth.users first)
      console.log('📝 Creating demo user...');
      try {
        await client.query(
          `INSERT INTO users (id, email) 
           VALUES ($1, $2)
           ON CONFLICT (id) DO NOTHING`,
          [DEMO_USER_ID, DEMO_USER_EMAIL]
        );
        console.log('✅ Demo user created\n');
      } catch (error) {
        console.log('⚠️  User might already exist or auth.users constraint issue (this is OK for demo)\n');
      }

      // 2. Create sample workouts
      console.log('💪 Creating sample workouts...');
      
      const workout1 = await client.query(
        `INSERT INTO workouts (user_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          DEMO_USER_ID,
          'Upper Body Strength',
          'A comprehensive upper body workout focusing on chest, back, and shoulders'
        ]
      );
      const workout1Id = workout1.rows[0].id;

      const workout2 = await client.query(
        `INSERT INTO workouts (user_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          DEMO_USER_ID,
          'Leg Day',
          'Intense lower body workout for building leg strength and muscle'
        ]
      );
      const workout2Id = workout2.rows[0].id;

      const workout3 = await client.query(
        `INSERT INTO workouts (user_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          DEMO_USER_ID,
          'Full Body Circuit',
          'Complete body workout combining strength and cardio'
        ]
      );
      const workout3Id = workout3.rows[0].id;

      console.log('✅ Created 3 workouts\n');

      // 3. Create exercises for workout 1 (Upper Body)
      console.log('🏋️ Creating exercises...');
      
      const benchPress = await client.query(
        `INSERT INTO exercises (workout_id, name, muscle_groups, equipment, instructions, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          workout1Id,
          'Bench Press',
          ['chest', 'triceps', 'shoulders'],
          'Barbell',
          'Lie on bench, lower bar to chest, press up explosively',
          0
        ]
      );
      const benchPressId = benchPress.rows[0].id;

      const pullUps = await client.query(
        `INSERT INTO exercises (workout_id, name, muscle_groups, equipment, instructions, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          workout1Id,
          'Pull Ups',
          ['back', 'biceps'],
          'Pull-up Bar',
          'Hang from bar, pull body up until chin clears bar',
          1
        ]
      );
      const pullUpsId = pullUps.rows[0].id;

      const shoulderPress = await client.query(
        `INSERT INTO exercises (workout_id, name, muscle_groups, equipment, instructions, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          workout1Id,
          'Shoulder Press',
          ['shoulders', 'triceps'],
          'Dumbbells',
          'Press weights overhead from shoulder height',
          2
        ]
      );
      const shoulderPressId = shoulderPress.rows[0].id;

      // Exercises for workout 2 (Leg Day)
      const squats = await client.query(
        `INSERT INTO exercises (workout_id, name, muscle_groups, equipment, instructions, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          workout2Id,
          'Barbell Squats',
          ['quadriceps', 'glutes', 'hamstrings'],
          'Barbell',
          'Lower body until thighs parallel to floor, drive up through heels',
          0
        ]
      );
      const squatsId = squats.rows[0].id;

      const deadlifts = await client.query(
        `INSERT INTO exercises (workout_id, name, muscle_groups, equipment, instructions, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          workout2Id,
          'Deadlifts',
          ['hamstrings', 'glutes', 'back'],
          'Barbell',
          'Lift bar from floor to standing position, keeping back straight',
          1
        ]
      );
      const deadliftsId = deadlifts.rows[0].id;

      console.log('✅ Created 5 exercises\n');

      // 4. Create exercise sets
      console.log('📊 Creating exercise sets...');

      // Bench Press sets
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [benchPressId, 4, 8, 185, 120, 0]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [benchPressId, 4, 8, 185, 120, 1]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [benchPressId, 4, 8, 185, 120, 2]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [benchPressId, 4, 8, 185, 120, 3]
      );

      // Pull Ups sets
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pullUpsId, 3, 10, null, 90, 0]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pullUpsId, 3, 10, null, 90, 1]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [pullUpsId, 3, 8, null, 90, 2]
      );

      // Squats sets
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [squatsId, 5, 5, 225, 180, 0]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [squatsId, 5, 5, 225, 180, 1]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [squatsId, 5, 5, 225, 180, 2]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [squatsId, 5, 5, 225, 180, 3]
      );
      await client.query(
        `INSERT INTO exercise_sets (exercise_id, sets, reps, weight, rest_seconds, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [squatsId, 5, 5, 225, 180, 4]
      );

      console.log('✅ Created exercise sets\n');

      // 5. Create sample supplements
      console.log('💊 Creating sample supplements...');

      const wheyProtein = await client.query(
        `INSERT INTO supplements (name, brand, description, category)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [
          'Whey Protein Powder',
          'MuscleTech',
          'High-quality whey protein isolate for post-workout recovery',
          'Protein'
        ]
      );

      const creatine = await client.query(
        `INSERT INTO supplements (name, brand, description, category)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [
          'Creatine Monohydrate',
          'Optimum Nutrition',
          'Pure creatine monohydrate for strength and power',
          'Performance'
        ]
      );

      const preWorkout = await client.query(
        `INSERT INTO supplements (name, brand, description, category)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [
          'Pre-Workout Energy',
          'C4',
          'Pre-workout supplement with caffeine and beta-alanine',
          'Energy'
        ]
      );

      console.log('✅ Created 3 supplements\n');

      // 6. Add ingredients to supplements
      console.log('🧪 Adding supplement ingredients...');

      if (wheyProtein.rows.length > 0) {
        const wheyId = wheyProtein.rows[0].id;
        await client.query(
          `INSERT INTO supplement_ingredients (supplement_id, ingredient_name, amount, order_index)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [wheyId, 'Whey Protein Isolate', '25g per serving', 0]
        );
        await client.query(
          `INSERT INTO supplement_ingredients (supplement_id, ingredient_name, amount, order_index)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [wheyId, 'L-Leucine', '5g per serving', 1]
        );
      }

      if (creatine.rows.length > 0) {
        const creatineId = creatine.rows[0].id;
        await client.query(
          `INSERT INTO supplement_ingredients (supplement_id, ingredient_name, amount, order_index)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [creatineId, 'Creatine Monohydrate', '5g per serving', 0]
        );
      }

      if (preWorkout.rows.length > 0) {
        const preWorkoutId = preWorkout.rows[0].id;
        await client.query(
          `INSERT INTO supplement_ingredients (supplement_id, ingredient_name, amount, order_index)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [preWorkoutId, 'Caffeine', '150mg per serving', 0]
        );
        await client.query(
          `INSERT INTO supplement_ingredients (supplement_id, ingredient_name, amount, order_index)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [preWorkoutId, 'Beta-Alanine', '1.6g per serving', 1]
        );
      }

      console.log('✅ Added supplement ingredients\n');

      console.log('✅ All dummy data seeded successfully!\n');
      console.log('📋 Summary:');
      console.log(`   - 1 demo user (${DEMO_USER_EMAIL})`);
      console.log(`   - 3 workouts`);
      console.log(`   - 5 exercises`);
      console.log(`   - Multiple exercise sets`);
      console.log(`   - 3 supplements with ingredients`);
      console.log('\n💡 Note: To use this data, sign in with any email and the demo user ID will be used.');
    });
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seed script
seedDummyData()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
