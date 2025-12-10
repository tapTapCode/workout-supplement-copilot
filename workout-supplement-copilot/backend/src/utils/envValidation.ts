/**
 * Environment variable validation
 * Validates required environment variables on startup
 */

interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: Array<{ key: string; reason: string }>;
  warnings: Array<{ key: string; reason: string }>; // For non-blocking issues in dev mode
}

export function validateEnvironment(): ValidationResult {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENAI_API_KEY',
  ];

  const missing: string[] = [];
  const invalid: Array<{ key: string; reason: string }> = [];

  for (const key of required) {
    const value = process.env[key];
    
    if (!value) {
      missing.push(key);
      continue;
    }

    // Validate DATABASE_URL format
    if (key === 'DATABASE_URL') {
      const validation = validateDatabaseUrl(value);
      if (!validation.valid) {
        // In development, allow placeholder values but warn
        if (process.env.NODE_ENV === 'development' && validation.reason.includes('placeholder')) {
          console.warn(`⚠️  WARNING: ${key} contains placeholder values. Database connections will fail.`);
          console.warn(`   ${validation.reason}`);
          // Don't add to invalid in dev mode for placeholders
        } else {
          invalid.push({ key, reason: validation.reason });
        }
      }
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nPlease set these variables before starting the server.');
  }

  if (invalid.length > 0) {
    console.error('\n❌ Invalid environment variable values:');
    invalid.forEach(({ key, reason }) => {
      console.error(`   - ${key}: ${reason}`);
    });
    console.error('\nPlease fix these values in your .env file.');
    
    // In development, allow server to start with warnings for non-critical issues
    if (process.env.NODE_ENV === 'development') {
      const criticalIssues = invalid.filter(({ reason }) => 
        !reason.includes('placeholder') && !reason.includes('host')
      );
      
      if (criticalIssues.length === 0) {
        console.warn('\n⚠️  Development mode: Server will start but database connections will fail.');
        console.warn('   Fix DATABASE_URL to enable database features.\n');
        return { valid: true, missing, invalid: [], warnings: [] }; // Allow start in dev mode
      }
    }
  }

  if (missing.length > 0 || invalid.length > 0) {
    return { valid: false, missing, invalid, warnings: [] };
  }

  console.log('✅ All required environment variables are set and valid');
  return { valid: true, missing: [], invalid: [], warnings: [] };
}

/**
 * Validate DATABASE_URL format
 */
function validateDatabaseUrl(url: string): { valid: boolean; reason: string } {
  // Check for placeholder values
  const placeholders = ['host', 'localhost', 'user', 'password', 'database', 'your-', 'example'];
  const lowerUrl = url.toLowerCase();
  
  for (const placeholder of placeholders) {
    if (lowerUrl.includes(placeholder) && !lowerUrl.includes('localhost') || 
        (lowerUrl.includes('host') && !lowerUrl.includes('localhost'))) {
      // Check if it's actually a placeholder (not a real hostname)
      if (lowerUrl.match(new RegExp(`@${placeholder}(?::|/|$)`))) {
        return {
          valid: false,
          reason: `Contains placeholder value "${placeholder}". Please replace with your actual database connection details.`
        };
      }
    }
  }

  // Check for common placeholder patterns
  if (url.includes('@host:') || url.includes('@host/')) {
    return {
      valid: false,
      reason: 'Contains placeholder "host". Please replace with your actual database hostname (e.g., db.example.com or localhost).'
    };
  }

  if (url.includes('user:password@')) {
    return {
      valid: false,
      reason: 'Contains placeholder "user:password". Please replace with your actual database username and password.'
    };
  }

  // Validate URL format
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'postgresql:' && urlObj.protocol !== 'postgres:') {
      return {
        valid: false,
        reason: `Invalid protocol "${urlObj.protocol}". Must be "postgresql:" or "postgres:".`
      };
    }
  } catch (e) {
    return {
      valid: false,
      reason: 'Invalid URL format. Expected format: postgresql://user:password@host:port/database'
    };
  }

  return { valid: true, reason: '' };
}

