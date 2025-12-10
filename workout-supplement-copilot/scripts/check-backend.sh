#!/bin/bash

# Quick check if backend is running
echo "🔍 Checking backend status..."
echo ""

if lsof -ti:3001 > /dev/null 2>&1; then
  echo "✅ Backend IS running on port 3001"
  echo ""
  echo "If you still see 'Failed to fetch', check:"
  echo "  - Backend logs for errors"
  echo "  - CORS configuration"
  echo "  - Frontend .env.local has NEXT_PUBLIC_API_URL=http://localhost:3001"
else
  echo "❌ Backend is NOT running on port 3001"
  echo ""
  echo "To start the backend:"
  echo "  cd backend"
  echo "  npm run dev"
  echo ""
  echo "You should see: 'Server running on port 3001'"
fi

echo ""
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "✅ Frontend IS running on port 3000"
else
  echo "❌ Frontend is NOT running on port 3000"
fi

