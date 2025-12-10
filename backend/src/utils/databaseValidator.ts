/**
 * Database connection validator
 * Tests database connection and provides helpful error messages
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: string;
}

/**
 * Validate database connection
 */
export async function validateDatabaseConnection(): Promise<ValidationResult> {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;

  if (!connectionString) {
    return {
      valid: false,
      message: 'DATABASE_URL is not set',
      details: 'Please set DATABASE_URL in your .env file',
    };
  }

  // Check for placeholder values
  const lowerUrl = connectionString.toLowerCase();
  if (lowerUrl.includes('@host:') || lowerUrl.includes('@host/')) {
    return {
      valid: false,
      message: 'DATABASE_URL contains placeholder "host"',
      details: 'Please replace "host" with your actual database hostname. For Supabase, use: [PROJECT].supabase.co',
    };
  }

  if (lowerUrl.includes('user:password@') && !lowerUrl.includes('localhost')) {
    return {
      valid: false,
      message: 'DATABASE_URL contains placeholder credentials',
      details: 'Please replace "user:password" with your actual database username and password',
    };
  }

  // Try to connect
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    const result = await pool.query('SELECT 1 as test');
    await pool.end();
    
    if (result.rows.length > 0) {
      return {
        valid: true,
        message: 'Database connection successful!',
      };
    }
  } catch (error) {
    await pool.end();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      // Extract hostname from error or URL
      let hostname = 'unknown';
      try {
        const url = new URL(connectionString);
        hostname = url.hostname;
      } catch (e) {
        // Ignore URL parse errors
      }

      return {
        valid: false,
        message: `Cannot connect to database server at "${hostname}"`,
        details: `The hostname "${hostname}" cannot be resolved. Please check:\n` +
          `  1. Is the hostname correct?\n` +
          `  2. Is the database server running?\n` +
          `  3. Do you have internet access (for cloud databases)?\n` +
          `  4. For Supabase: Is your project active?`,
      };
    }

    if (errorMessage.includes('password authentication failed')) {
      return {
        valid: false,
        message: 'Database authentication failed',
        details: 'The username or password in DATABASE_URL is incorrect. Please check your credentials.',
      };
    }

    if (errorMessage.includes('timeout')) {
      return {
        valid: false,
        message: 'Database connection timeout',
        details: 'The database server did not respond. Please check if the server is running and accessible.',
      };
    }

    return {
      valid: false,
      message: 'Database connection failed',
      details: errorMessage,
    };
  }

  return {
    valid: false,
    message: 'Unknown database connection error',
  };
}

/**
 * Run validation from command line
 */
if (require.main === module) {
  validateDatabaseConnection()
    .then((result) => {
      if (result.valid) {
        console.log('✅', result.message);
        process.exit(0);
      } else {
        console.error('❌', result.message);
        if (result.details) {
          console.error('\n', result.details);
        }
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Validation error:', error);
      process.exit(1);
    });
}

