#!/bin/bash

# End-to-end test script
# Tests the complete flow: create workout -> get recommendation -> verify compliance

set -e

API_URL="${API_URL:-http://localhost:3001}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

echo "🧪 End-to-End Test Suite"
echo "========================"
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s "$API_URL/health" || echo "FAILED")
if [[ "$HEALTH_RESPONSE" == *"ok"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}\n"
else
    echo -e "${RED}❌ Health check failed${NC}\n"
    exit 1
fi

# Test 2: Create workout (requires auth token)
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Skipping authenticated tests (AUTH_TOKEN not set)${NC}"
    echo -e "${YELLOW}To test with auth, set AUTH_TOKEN environment variable${NC}\n"
    exit 0
fi

echo -e "${YELLOW}Test 2: Create Workout${NC}"
WORKOUT_RESPONSE=$(curl -s -X POST "$API_URL/api/workouts" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Workout",
        "description": "Test workout for E2E testing",
        "exercises": [
            {
                "name": "Bench Press",
                "muscle_groups": ["chest", "triceps"],
                "equipment": "Barbell",
                "sets": [
                    {"sets": 3, "reps": 10, "weight": 135}
                ]
            }
        ]
    }' || echo "FAILED")

if [[ "$WORKOUT_RESPONSE" == *"id"* ]]; then
    WORKOUT_ID=$(echo "$WORKOUT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Workout created: $WORKOUT_ID${NC}\n"
else
    echo -e "${RED}❌ Failed to create workout${NC}"
    echo "Response: $WORKOUT_RESPONSE\n"
    exit 1
fi

# Test 3: Get copilot recommendation
echo -e "${YELLOW}Test 3: Get Copilot Recommendation${NC}"
REC_RESPONSE=$(curl -s -X POST "$API_URL/api/copilot/recommend" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"workout_id\": \"$WORKOUT_ID\",
        \"user_goals\": [\"build muscle\"]
    }" || echo "FAILED")

if [[ "$REC_RESPONSE" == *"recommendation"* ]]; then
    echo -e "${GREEN}✅ Recommendation received${NC}"
    
    # Check for citations
    if [[ "$REC_RESPONSE" == *"citations"* ]]; then
        echo -e "${GREEN}✅ Citations present${NC}"
    else
        echo -e "${YELLOW}⚠️  No citations found${NC}"
    fi
    
    # Check for reasoning
    if [[ "$REC_RESPONSE" == *"reasoning"* ]]; then
        echo -e "${GREEN}✅ Reasoning present${NC}"
    else
        echo -e "${YELLOW}⚠️  No reasoning found${NC}"
    fi
    
    echo ""
else
    echo -e "${RED}❌ Failed to get recommendation${NC}"
    echo "Response: $REC_RESPONSE\n"
    exit 1
fi

# Test 4: Verify compliance (check that no banned ingredients are in response)
echo -e "${YELLOW}Test 4: Verify Compliance${NC}"
if [[ "$REC_RESPONSE" == *"Ephedrine"* ]] || [[ "$REC_RESPONSE" == *"DMAA"* ]]; then
    echo -e "${RED}❌ Banned ingredients found in recommendation!${NC}\n"
    exit 1
else
    echo -e "${GREEN}✅ No banned ingredients detected${NC}\n"
fi

echo -e "${GREEN}🎉 All tests passed!${NC}"

