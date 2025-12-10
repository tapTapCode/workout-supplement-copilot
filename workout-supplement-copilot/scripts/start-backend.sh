#!/bin/bash

# Helper script to start the backend server
# Usage: ./scripts/start-backend.sh

echo "🚀 Starting Backend Server..."
echo ""

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: backend/package.json not found!"
    echo "   Make sure you're running this from the project root directory."
    exit 1
fi

# Change to backend directory
cd backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: backend/.env file not found!"
    echo "   Creating template..."
    ../scripts/fix-database-url.sh
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "✅ Starting backend server on port 3001..."
echo "   Press Ctrl+C to stop"
echo ""

npm run dev

