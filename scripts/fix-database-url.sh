#!/bin/bash

# Script to help fix DATABASE_URL in backend/.env
# Usage: ./scripts/fix-database-url.sh

echo "🔧 DATABASE_URL Configuration Helper"
echo ""

BACKEND_ENV="backend/.env"

if [ ! -f "$BACKEND_ENV" ]; then
    echo "❌ backend/.env file not found!"
    echo ""
    echo "Creating template..."
    cat > "$BACKEND_ENV" << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-jwt-secret-here

# OpenAI API Key (get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-key-here

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ Created $BACKEND_ENV with template"
    echo ""
fi

# Check current DATABASE_URL
CURRENT_DB=$(grep "^DATABASE_URL=" "$BACKEND_ENV" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$CURRENT_DB" ]; then
    echo "❌ DATABASE_URL not found in $BACKEND_ENV"
    exit 1
fi

echo "Current DATABASE_URL:"
echo "  $CURRENT_DB"
echo ""

# Check for placeholder values
if echo "$CURRENT_DB" | grep -q "@host:" || echo "$CURRENT_DB" | grep -q "@host/"; then
    echo "⚠️  WARNING: DATABASE_URL contains placeholder 'host'!"
    echo ""
    echo "You need to replace 'host' with your actual database hostname."
    echo ""
    echo "Options:"
    echo ""
    echo "1️⃣  SUPABASE (Recommended for development):"
    echo "   - Go to: https://supabase.com"
    echo "   - Select your project"
    echo "   - Go to: Settings → Database"
    echo "   - Copy 'Connection string' (URI format)"
    echo "   - Replace [YOUR-PASSWORD] with your database password"
    echo ""
    echo "   Format:"
    echo "   DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
    echo ""
    echo "2️⃣  LOCAL POSTGRESQL:"
    echo "   - Make sure PostgreSQL is running locally"
    echo "   - Format:"
    echo "   DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
    echo ""
    echo "3️⃣  OTHER CLOUD DATABASE:"
    echo "   - Use your provider's connection string"
    echo "   - Format: postgresql://user:password@hostname:port/database"
    echo ""
    echo "After updating, test the connection with:"
    echo "  ./scripts/check-database.sh"
    echo ""
    exit 1
fi

# Test connection
echo "🧪 Testing database connection..."
cd backend
node -e "
  require('dotenv').config();
  const { Pool } = require('pg');
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    connectionTimeoutMillis: 5000 
  });
  
  pool.query('SELECT 1 as test')
    .then(() => {
      console.log('✅ Database connection successful!');
      process.exit(0);
    })
    .catch(e => {
      console.error('❌ Database connection failed:');
      console.error('   ' + e.message);
      if (e.message.includes('ENOTFOUND')) {
        console.error('   → Check if hostname is correct');
      } else if (e.message.includes('password')) {
        console.error('   → Check if credentials are correct');
      } else if (e.message.includes('timeout')) {
        console.error('   → Check if database server is running');
      }
      process.exit(1);
    });
" 2>&1

cd ..

