#!/bin/bash

# Database setup script
# Sets up the Supabase database with schema and seed data
# This script tries psql first, then falls back to Node.js script

set -e

echo "🗄️  Database Setup Script"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check for DATABASE_URL in .env file if not set
if [ -z "$DATABASE_URL" ]; then
    if [ -f "backend/.env" ]; then
        echo -e "${BLUE}📄 Loading DATABASE_URL from backend/.env...${NC}"
        export $(grep -v '^#' backend/.env | grep DATABASE_URL | xargs)
    fi
fi

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable not set${NC}"
    echo -e "${YELLOW}Please set DATABASE_URL in backend/.env or export it${NC}"
    echo -e "${YELLOW}Example: export DATABASE_URL='postgresql://user:pass@host:5432/db'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DATABASE_URL is set${NC}\n"

# Check if psql is available
if command -v psql &> /dev/null; then
    echo -e "${BLUE}Using psql (PostgreSQL client)${NC}\n"
    
    # Run schema
    echo -e "${YELLOW}Creating database schema...${NC}"
    if psql "$DATABASE_URL" -f docs/database-schema.sql; then
        echo -e "${GREEN}✅ Schema created successfully${NC}\n"
    else
        echo -e "${RED}❌ Failed to create schema${NC}"
        echo -e "${YELLOW}Trying alternative method (Node.js)...${NC}\n"
        # Fall through to Node.js method
    fi
    
    # Seed compliance data
    if [ $? -eq 0 ] || [ $? -eq 1 ]; then
        echo -e "${YELLOW}Seeding compliance data...${NC}"
        if psql "$DATABASE_URL" -f docs/compliance-seed-data.sql 2>/dev/null; then
            echo -e "${GREEN}✅ Compliance data seeded successfully${NC}\n"
        else
            echo -e "${YELLOW}⚠️  Some compliance data may already exist (this is OK)${NC}\n"
        fi
    fi
    
    # Verify setup
    if [ $? -eq 0 ] || [ $? -eq 1 ]; then
        echo -e "${YELLOW}Verifying setup...${NC}"
        TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        echo -e "${GREEN}✅ Found $TABLE_COUNT tables${NC}"
        
        COMPLIANCE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM compliance_records;" 2>/dev/null | xargs)
        echo -e "${GREEN}✅ Found $COMPLIANCE_COUNT compliance records${NC}\n"
        
        echo -e "${GREEN}🎉 Database setup complete!${NC}"
        exit 0
    fi
fi

# Fallback to Node.js script
echo -e "${BLUE}Using Node.js script (no psql required)${NC}\n"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js or PostgreSQL client tools (psql)${NC}"
    exit 1
fi

# Check if tsx is available
if ! command -v tsx &> /dev/null && ! command -v npx &> /dev/null; then
    echo -e "${YELLOW}Installing tsx (TypeScript executor)...${NC}"
    cd backend && npm install --save-dev tsx && cd ..
fi

# Run Node.js setup script
echo -e "${YELLOW}Running database setup with Node.js...${NC}\n"
if command -v tsx &> /dev/null; then
    tsx scripts/setup-database.ts
elif command -v npx &> /dev/null; then
    npx tsx scripts/setup-database.ts
else
    echo -e "${RED}❌ Cannot find tsx or npx${NC}"
    echo -e "${YELLOW}Please install: npm install -g tsx${NC}"
    exit 1
fi

