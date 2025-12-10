#!/bin/bash

# Helper script to start the frontend server
# Usage: ./scripts/start-frontend.sh

echo "🚀 Starting Frontend Server..."
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: frontend/package.json not found!"
    echo "   Make sure you're running this from the project root directory."
    exit 1
fi

# Change to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "✅ Starting frontend server on port 3000..."
echo "   Press Ctrl+C to stop"
echo ""

npm run dev

