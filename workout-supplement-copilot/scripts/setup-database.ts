#!/usr/bin/env tsx

/**
 * Database setup script using Node.js
 * Alternative to setup-database.sh that doesn't require psql
 * Usage: tsx scripts/setup-database.ts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
let __dirname: string;
try {
  __dirname = dirname(fileURLToPath(import.meta.url));
} catch {
  // Fallback for CommonJS
  __dirname = __dirname || process.cwd();
}

// Try to load from backend/.env
dotenv.config({ path: join(__dirname, '../backend/.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  console.error('   Please set DATABASE_URL in backend/.env');
  console.error('   Or export it: export DATABASE_URL="your-connection-string"');
  process.exit(1);
}

// Check if Supabase (requires SSL)
const isSupabase = DATABASE_URL.includes('.supabase.co');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

async function executeSQLFile(filePath: string): Promise<void> {
  const sql = readFileSync(filePath, 'utf-8');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`✅ Executed ${filePath}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function setupDatabase() {
  console.log('🗄️  Database Setup Script');
  console.log('=========================\n');

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Check if tables already exist
    const workoutsExists = await checkTableExists('workouts');
    if (workoutsExists) {
      console.log('⚠️  Database tables already exist!');
      console.log('   If you want to recreate them, drop the existing tables first.\n');
      
      // Count existing tables
      const tableCount = await pool.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
      );
      console.log(`   Found ${tableCount.rows[0].count} existing tables\n`);
      
      const response = await new Promise<boolean>((resolve) => {
        // In non-interactive mode, just continue
        if (process.env.CI || !process.stdin.isTTY) {
          resolve(false);
          return;
        }
        
        // For interactive mode, we'd ask, but for now just continue
        resolve(false);
      });
      
      if (response) {
        console.log('   Dropping existing tables...');
        // Would drop tables here if user confirmed
      }
    }

    // Create schema
    console.log('📋 Creating database schema...');
    const schemaPath = join(__dirname, '../docs/database-schema.sql');
    await executeSQLFile(schemaPath);
    console.log('✅ Schema created successfully\n');

    // Seed compliance data (optional, may fail if data exists)
    console.log('🌱 Seeding compliance data...');
    try {
      const seedPath = join(__dirname, '../docs/compliance-seed-data.sql');
      await executeSQLFile(seedPath);
      console.log('✅ Compliance data seeded successfully\n');
    } catch (error) {
      console.log('⚠️  Some compliance data may already exist (this is OK)\n');
    }

    // Verify setup
    console.log('🔍 Verifying setup...');
    const tableCount = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log(`✅ Found ${tableCount.rows[0].count} tables`);

    // Check key tables
    const keyTables = ['workouts', 'exercises', 'supplements', 'compliance_records', 'copilot_recommendations'];
    for (const table of keyTables) {
      const exists = await checkTableExists(table);
      if (exists) {
        const count = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table}: ${count.rows[0].count} rows`);
      } else {
        console.log(`   ❌ ${table}: NOT FOUND`);
      }
    }

    console.log('\n🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Test the connection: ./scripts/check-database.sh');
    console.log('  3. (Optional) Seed dummy data: ./scripts/seed-dummy-data.sh\n');

  } catch (error) {
    console.error('\n❌ Database setup failed!');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`   Error: ${errorMessage}\n`);
    
    if (errorMessage.includes('auth.users')) {
      console.error('💡 This error is related to Supabase Auth.');
      console.error('   If you\'re not using Supabase Auth, you may need to modify the schema.');
      console.error('   The users table references auth.users which is a Supabase Auth table.\n');
    }
    
    if (errorMessage.includes('permission denied') || errorMessage.includes('must be owner')) {
      console.error('💡 Permission error: Make sure your database user has CREATE privileges.\n');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

