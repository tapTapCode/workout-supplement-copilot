import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or SUPABASE_URL environment variable is not set!');
  console.error('   Please set DATABASE_URL in your .env file');
  console.error('   Example: DATABASE_URL=postgresql://user:password@host:5432/database');
} else {
  // Check for placeholder values (only warn, don't prevent startup)
  const lowerUrl = connectionString.toLowerCase();
  if (lowerUrl.includes('@host:') || lowerUrl.includes('@host/') || 
      (lowerUrl.includes('user:password@') && !lowerUrl.includes('localhost'))) {
    console.warn('\n⚠️  WARNING: DATABASE_URL appears to contain placeholder values!');
    console.warn('   Current value contains: "host" or placeholder credentials');
    console.warn('   Database connections will fail until this is fixed.');
    console.warn('\n   Quick fix:');
    console.warn('   - For Supabase: Get connection string from Settings → Database');
    console.warn('   - Format: postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres');
    console.warn('   - Run: ./scripts/fix-database-url.sh for help\n');
  }
}

// Supabase requires SSL connections
const isSupabase = connectionString?.includes('.supabase.co');
const poolConfig: PoolConfig = {
  connectionString,
  ssl: isSupabase || process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for better error messages
};

const pool = connectionString ? new Pool(poolConfig) : null;

// Test connection
if (pool) {
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
    // Don't exit in development to allow debugging
    if (process.env.NODE_ENV === 'production') {
  process.exit(-1);
    }
});
}

export default pool;

// Export connection status check
export function isDatabaseConfigured(): boolean {
  return !!connectionString;
}

/**
 * Execute a query with error handling
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  try {
    // Check if pool is initialized
    if (!pool) {
      throw new Error('Database pool not initialized. Check DATABASE_URL environment variable.');
    }
    
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res.rows as T[];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error('Query error', { 
      text: text.substring(0, 100), // Log first 100 chars to avoid huge logs
      error: errorMessage,
      hasConnectionString: !!process.env.DATABASE_URL,
    });
    
    // Provide more helpful error messages
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      // Extract hostname from connection string for better error message
      let hostname = 'unknown';
      try {
        const url = new URL(connectionString || '');
        hostname = url.hostname;
      } catch (e) {
        // Ignore URL parse errors
      }
      
      let detailedMessage = `Database connection failed: Cannot resolve hostname "${hostname}".\n\n`;
      
      if (hostname.includes('.supabase.co')) {
        detailedMessage += `This appears to be a Supabase database. Common causes:\n`;
        detailedMessage += `  1. ❌ Project is paused or deleted - Check your Supabase dashboard\n`;
        detailedMessage += `  2. ❌ Hostname is incorrect - Verify in Supabase Settings → Database\n`;
        detailedMessage += `  3. ❌ Project was moved/renamed - Get the new connection string\n\n`;
        detailedMessage += `💡 How to fix:\n`;
        detailedMessage += `  - Go to https://supabase.com → Your Project\n`;
        detailedMessage += `  - Check if project is active (not paused)\n`;
        detailedMessage += `  - Go to Settings → Database\n`;
        detailedMessage += `  - Copy the correct connection string (URI format)\n`;
        detailedMessage += `  - Update DATABASE_URL in backend/.env\n`;
      } else {
        detailedMessage += `Possible causes:\n`;
        detailedMessage += `  1. ❌ Hostname is incorrect\n`;
        detailedMessage += `  2. ❌ Database server is not running\n`;
        detailedMessage += `  3. ❌ Network/DNS issues\n`;
        detailedMessage += `  4. ❌ Firewall blocking connection\n\n`;
        detailedMessage += `💡 How to fix:\n`;
        detailedMessage += `  - Verify the hostname is correct\n`;
        detailedMessage += `  - Check if database server is running\n`;
        detailedMessage += `  - Test DNS: nslookup ${hostname}\n`;
        detailedMessage += `  - Check network connectivity\n`;
      }
      
      throw new Error(detailedMessage);
    }
    if (errorMessage.includes('does not exist')) {
      throw new Error(`Database table does not exist. Run database migrations first. ${errorMessage}`);
    }
    if (errorMessage.includes('timeout')) {
      throw new Error(`Database connection timeout. Check if database server is running. ${errorMessage}`);
    }
    
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  if (!pool) {
    throw new Error('Database pool not initialized. Check DATABASE_URL environment variable.');
  }
  
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
