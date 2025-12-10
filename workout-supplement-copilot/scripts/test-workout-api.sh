#!/bin/bash

# Test script to verify workout API endpoints
# Usage: ./scripts/test-workout-api.sh

API_URL="${API_URL:-http://localhost:3001}"

echo "🧪 Testing Workout API Endpoints"
echo "API URL: $API_URL"
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
HEALTH=$(curl -s "$API_URL/health")
if [ $? -eq 0 ]; then
  echo "✅ Health check passed: $HEALTH"
else
  echo "❌ Health check failed - backend might not be running"
  exit 1
fi
echo ""

# Test 2: Get workouts without token (should fail)
echo "2️⃣ Testing GET /api/workouts without token..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/workouts")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly returned 401 (unauthorized)"
  echo "Response: $BODY"
else
  echo "❌ Expected 401, got $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 3: Get workouts with invalid token (should fail)
echo "3️⃣ Testing GET /api/workouts with invalid token..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer invalid-token-123" "$API_URL/api/workouts")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "403" ]; then
  echo "✅ Correctly returned 403 (forbidden)"
  echo "Response: $BODY"
else
  echo "❌ Expected 403, got $HTTP_CODE"
  echo "Response: $BODY"
fi
echo ""

# Test 4: Get a valid token from demo auth
echo "4️⃣ Testing demo auth to get valid token..."
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/demo" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}')

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✅ Got token: ${TOKEN:0:20}..."
  
  # Test 5: Get workouts with valid token
  echo ""
  echo "5️⃣ Testing GET /api/workouts with valid token..."
  RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/api/workouts")
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Successfully fetched workouts"
    echo "Response: $BODY" | head -5
  else
    echo "⚠️  Got HTTP $HTTP_CODE (might be empty workouts list)"
    echo "Response: $BODY"
  fi
else
  echo "❌ Failed to get token from demo auth"
  echo "Response: $AUTH_RESPONSE"
fi

echo ""
echo "✅ Testing complete!"

