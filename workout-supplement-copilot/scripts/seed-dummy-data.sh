#!/bin/bash

# Seed dummy data script
# Usage: ./scripts/seed-dummy-data.sh

set -e

echo "🌱 Seeding dummy data..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set it first:"
  echo "  export DATABASE_URL=\"your-database-connection-string\""
  echo "  ./scripts/seed-dummy-data.sh"
  exit 1
fi

# Check if tsx is available
if ! command -v tsx &> /dev/null; then
  echo "📦 Installing tsx..."
  cd backend && npm install tsx --save-dev && cd ..
fi

# Run the seed script
echo "🚀 Running seed script..."
cd "$(dirname "$0")/.."
tsx scripts/seed-dummy-data.ts

echo ""
echo "✅ Done!"

