#!/bin/bash

# Script to generate JWT_SECRET and help set up environment variables

echo "🔑 Environment Variables Setup Helper"
echo "======================================"
echo ""

# Generate JWT_SECRET
echo "1. Generating JWT_SECRET..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null)

if [ -z "$JWT_SECRET" ]; then
    # Fallback to openssl
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null)
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Could not generate JWT_SECRET. Please install Node.js or OpenSSL."
    exit 1
fi

echo "✅ JWT_SECRET generated:"
echo "   $JWT_SECRET"
echo ""

# Check if .env files exist
echo "2. Checking environment files..."

if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env template..."
    cat > backend/.env << ENVEOF
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret (generated for you)
JWT_SECRET=$JWT_SECRET

# Supabase JWT Secret (get from Supabase Dashboard → Settings → API)
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-here

# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key-here

# OpenAI Model
OPENAI_MODEL=gpt-4-turbo-preview

# CORS
CORS_ORIGIN=http://localhost:3000

# Server
PORT=3001
NODE_ENV=development
ENVEOF
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists (not overwriting)"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend/.env.local template..."
    cat > frontend/.env.local << ENVEOF
NEXT_PUBLIC_API_URL=http://localhost:3001
ENVEOF
    echo "✅ Created frontend/.env.local"
else
    echo "⚠️  frontend/.env.local already exists (not overwriting)"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Get OpenAI API Key: https://platform.openai.com/api-keys"
echo "2. Get Database URL: From Supabase or your PostgreSQL"
echo "3. Update backend/.env with your actual values"
echo "4. Run: ./scripts/setup-database.sh"
echo ""
echo "📖 For detailed instructions, see ENVIRONMENT_SETUP.md"
