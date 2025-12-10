#!/bin/bash

# Deployment script for Workout & Supplement Copilot
# This script helps deploy the application to production

set -e

echo "🚀 Workout & Supplement Copilot Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check environment variables
echo -e "\n${YELLOW}Checking environment variables...${NC}"

REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "OPENAI_API_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "   - $var"
    done
    echo -e "\n${YELLOW}Please set these variables before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All required environment variables are set${NC}"

# Build shared package
echo -e "\n${YELLOW}Building shared package...${NC}"
cd shared
npm install
npm run build
cd ..

# Deploy backend
echo -e "\n${YELLOW}Deploying backend to AWS Lambda...${NC}"
cd backend

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}Installing Serverless Framework...${NC}"
    npm install -g serverless
fi

npm install
npm run build

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo -e "${YELLOW}Please run 'aws configure' first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS credentials configured${NC}"

# Deploy
read -p "Deploy backend to AWS Lambda? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    serverless deploy --stage production
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping backend deployment${NC}"
fi

cd ..

# Deploy frontend
echo -e "\n${YELLOW}Deploying frontend to Vercel...${NC}"
cd frontend

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

npm install
npm run build

read -p "Deploy frontend to Vercel? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping frontend deployment${NC}"
fi

cd ..

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update CORS_ORIGIN in backend with your Vercel URL"
echo "2. Update NEXT_PUBLIC_API_URL in frontend with your API Gateway URL"
echo "3. Test the application end-to-end"

