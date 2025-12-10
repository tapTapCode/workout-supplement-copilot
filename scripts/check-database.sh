#!/bin/bash

# Script to check database configuration and connection
# Usage: ./scripts/check-database.sh

echo "🔍 Checking Database Configuration"
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
  echo "❌ backend/.env file does not exist"
  echo ""
  echo "Create it with:"
  echo "  DATABASE_URL=postgresql://user:password@host:5432/database"
  echo "  JWT_SECRET=your-secret-key"
  echo "  OPENAI_API_KEY=your-openai-key"
  exit 1
fi

echo "✅ backend/.env file exists"

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL" backend/.env; then
  echo "✅ DATABASE_URL is set in .env"
  
  # Try to extract and test connection (without exposing password)
  DB_URL=$(grep "DATABASE_URL" backend/.env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  
  if [ -z "$DB_URL" ]; then
    echo "⚠️  DATABASE_URL is empty"
  else
    # Extract host from connection string
    if echo "$DB_URL" | grep -q "@"; then
      HOST=$(echo "$DB_URL" | sed -E 's/.*@([^:]+).*/\1/')
      echo "   Host: $HOST"
    fi
    
    # Test connection
    echo ""
    echo "🧪 Testing database connection..."
    cd backend
    node -e "
      require('dotenv').config();
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
      pool.query('SELECT 1 as test')
        .then(() => {
          console.log('✅ Database connection successful!');
          process.exit(0);
        })
        .catch(e => {
          console.error('❌ Database connection failed:');
          console.error('   ' + e.message);
          if (e.message.includes('ENOTFOUND')) {
            console.error('   → Check if DATABASE_URL hostname is correct');
          } else if (e.message.includes('password')) {
            console.error('   → Check if DATABASE_URL credentials are correct');
          } else if (e.message.includes('timeout')) {
            console.error('   → Check if database server is running and accessible');
          }
          process.exit(1);
        });
    " 2>&1
    cd ..
  fi
else
  echo "❌ DATABASE_URL is NOT set in .env"
  echo ""
  echo "Add this line to backend/.env:"
  echo "  DATABASE_URL=postgresql://user:password@host:5432/database"
  echo ""
  echo "For Supabase:"
  echo "  DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
fi

echo ""
echo "✅ Check complete!"

