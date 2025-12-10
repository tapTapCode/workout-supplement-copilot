import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { ipRateLimiter } from './middleware/rateLimiter';
import { auditLogger } from './middleware/auditLogger';
import { validateEnvironment } from './utils/envValidation';

dotenv.config();

// Validate environment variables
if (process.env.NODE_ENV !== 'test') {
  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    console.error('\n❌ Environment validation failed!');
    if (envCheck.invalid && envCheck.invalid.length > 0) {
      console.error('\n💡 Quick Fix:');
      console.error('   1. Edit backend/.env file');
      console.error('   2. Replace placeholder values with actual database credentials');
      console.error('   3. For Supabase: Get connection string from Settings → Database');
      console.error('   4. Run: ./scripts/fix-database-url.sh for help\n');
      
      // In development, allow server to start with warnings for placeholder DATABASE_URL
      if (process.env.NODE_ENV === 'development') {
        const onlyPlaceholderIssues = envCheck.invalid.every(({ reason }) => 
          reason.includes('placeholder') || reason.includes('host')
        );
        
        if (onlyPlaceholderIssues && envCheck.missing.length === 0) {
          console.warn('⚠️  Development mode: Starting server anyway.');
          console.warn('   Database features will not work until DATABASE_URL is fixed.\n');
          // Don't exit - allow server to start
        } else {
          console.error('Exiting due to invalid environment variables');
          process.exit(1);
        }
      } else {
        console.error('Exiting due to invalid environment variables');
        process.exit(1);
      }
    } else if (envCheck.missing.length > 0) {
      console.error('Exiting due to missing environment variables');
      process.exit(1);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Rate limiting (IP-based for unauthenticated requests)
app.use(ipRateLimiter);

// Audit logging
app.use(auditLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import workoutRoutes from './routes/workoutRoutes';
import copilotRoutes from './routes/copilotRoutes';
import supplementRoutes from './routes/supplementRoutes';
import complianceRoutes from './routes/complianceRoutes';
import authRoutes from './routes/authRoutes';

app.get('/api', (req, res) => {
  res.json({ message: 'Workout & Supplement Copilot API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/supplements', supplementRoutes);
app.use('/api/compliance', complianceRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server (only if not in Lambda)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export app for serverless
export default app;
