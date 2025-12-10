#!/bin/bash

# Fix common errors script
# This script diagnoses and fixes common setup issues

echo "🔧 Diagnosing Common Issues"
echo "============================"
echo ""

# Check Node.js
echo "1. Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org/"
    exit 1
else
    echo "✅ Node.js $(node --version) is installed"
fi

# Check npm
echo ""
echo "2. Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
else
    echo "✅ npm $(npm --version) is installed"
fi

# Check if dependencies are installed
echo ""
echo "3. Checking dependencies..."

if [ ! -d "shared/node_modules" ]; then
    echo "⚠️  Shared package dependencies missing"
    echo "   Installing..."
    cd shared && npm install && npm run build && cd ..
    echo "✅ Shared package installed"
else
    echo "✅ Shared package dependencies installed"
fi

if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  Backend dependencies missing"
    echo "   Installing..."
    cd backend && npm install && cd ..
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies installed"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies missing"
    echo "   Installing..."
    cd frontend && npm install && cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies installed"
fi

# Check .env files
echo ""
echo "4. Checking environment files..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env is missing"
    echo "   Run: ./scripts/generate-secrets.sh"
else
    echo "✅ backend/.env exists"
    
    # Check if JWT_SECRET is set
    if grep -q "JWT_SECRET=your-secret-key\|JWT_SECRET=$" backend/.env 2>/dev/null; then
        echo "⚠️  JWT_SECRET needs to be set in backend/.env"
    else
        echo "✅ JWT_SECRET is configured"
    fi
    
    # Check if OPENAI_API_KEY is set
    if grep -q "OPENAI_API_KEY=sk-your-openai\|OPENAI_API_KEY=$" backend/.env 2>/dev/null; then
        echo "⚠️  OPENAI_API_KEY needs to be set in backend/.env"
    else
        echo "✅ OPENAI_API_KEY is configured"
    fi
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local is missing"
    echo "   Run: ./scripts/generate-secrets.sh"
else
    echo "✅ frontend/.env.local exists"
fi

# Check database connection
echo ""
echo "5. Checking database setup..."
if [ -f "backend/.env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [[ "$DATABASE_URL" == *"postgresql://"* ]] && [[ "$DATABASE_URL" != *"user:password"* ]]; then
        echo "✅ DATABASE_URL is configured"
    else
        echo "⚠️  DATABASE_URL needs to be configured in backend/.env"
    fi
else
    echo "⚠️  Cannot check DATABASE_URL (backend/.env missing)"
fi

# Check script permissions
echo ""
echo "6. Checking script permissions..."
SCRIPTS=("scripts/generate-secrets.sh" "scripts/test-jwt.sh" "scripts/setup-database.sh" "scripts/deploy.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ ! -x "$script" ]; then
            echo "⚠️  Making $script executable..."
            chmod +x "$script"
        fi
    fi
done
echo "✅ Script permissions OK"

echo ""
echo "📋 Summary:"
echo "If you see any ⚠️ warnings above, address them:"
echo "  - Missing dependencies: Run 'npm install' in each directory"
echo "  - Missing .env files: Run './scripts/generate-secrets.sh'"
echo "  - Missing API keys: See ENVIRONMENT_SETUP.md"
echo ""
echo "✅ If everything shows ✅, you should be ready to run the app!"

