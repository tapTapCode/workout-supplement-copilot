# Workout & Supplement Copilot (FDA-aware)

A web application that helps users design workouts and provides AI-powered supplement recommendations with FDA compliance checking and source citations.

## Project Structure

```
workout-supplement-copilot/
├── docs/                 # Additional documentation
├── frontend/             # Next.js frontend application
├── backend/              # AWS Lambda functions
├── shared/               # Shared types and utilities
└── scripts/              # Deployment and utility scripts
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- OpenAI API key

### 1. Install Dependencies

```bash
# Install shared package
cd shared && npm install && npm run build

# Install backend
cd ../backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Set Up Environment Variables

**Quick Setup (Recommended):**
```bash
# Generate secrets and create .env templates
./scripts/generate-secrets.sh
```

**Manual Setup:**

**Backend** - Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
OPENAI_API_KEY=sk-your-openai-key  # Get from: https://platform.openai.com/api-keys
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

**Frontend** - Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Set Up Database

```bash
# Using Supabase (recommended)
# 1. Get your connection string from https://supabase.com → Your Project → Settings → Database
# 2. Add it to backend/.env as DATABASE_URL
# 3. Run the setup script:
./scripts/setup-database.sh
```

**For Supabase:**
- Go to https://supabase.com
- Select your project → Settings → Database
- Copy the connection string (URI format)
- Replace `[YOUR-PASSWORD]` with your database password
- Add to `backend/.env`: `DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres`

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Open in Browser

Visit: **http://localhost:3000**

## Features

- ✅ Workout creation and management
- ✅ AI-powered supplement recommendations with LangChain/LangGraph
- ✅ FDA compliance checking with citations
- ✅ User authentication and authorization
- ✅ Workout scheduling
- ✅ Supplement search and browsing
- ✅ Compliance verification API
- ✅ Rate limiting and security
- ✅ Audit logging
- ✅ Error boundaries and error handling

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: AWS Lambda, API Gateway
- **Database**: Supabase (PostgreSQL)
- **AI**: LangChain, LangGraph, OpenAI GPT-4
- **Deployment**: Vercel (frontend), AWS (backend)

## Deployment

### Vercel (Frontend)

**Important**: For Vercel deployment, you MUST set the Root Directory to `frontend` in Vercel project settings.

1. Go to **Project Settings** → **General**
2. Under **Root Directory**, select `frontend`
3. Save the changes

The `vercel.json` file is configured to:
- Build from the `frontend/` directory (when Root Directory is set to `frontend`)
- Output to `.next` (relative to frontend/)
- Use `npm install` for dependency installation

**Note**: The frontend uses TypeScript path mapping to reference the `shared/` package. When Root Directory is set to `frontend`, the path `../shared/src` will correctly resolve to the shared package.

### Environment Variables for Vercel

Add these in your Vercel project settings:
- `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://api.workout-copilot.aws.com`)

### Troubleshooting Vercel Build Issues

**Git Submodule Warning:**
If you see "Failed to fetch one or more git submodules" warning:
- This is harmless - the repository has no submodules
- The warning has been disabled in GitHub Actions workflows
- If it persists in Vercel, it can be safely ignored as it doesn't affect the build

## License

MIT
