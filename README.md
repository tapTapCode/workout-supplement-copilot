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

**Important**: When deploying to Vercel, you must set the **Root Directory** to `frontend`:

1. Go to your Vercel project settings
2. Navigate to **Settings** → **General**
3. Under **Root Directory**, select `frontend`
4. Save the changes

Alternatively, you can set it when importing the project:
- When importing from GitHub, click **"Configure Project"**
- Set **Root Directory** to `frontend`
- Vercel will automatically detect Next.js from `frontend/package.json`

The `vercel.json` file is already configured with the correct build commands and output directory.

### Environment Variables for Vercel

Add these in your Vercel project settings:
- `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://api.workout-copilot.aws.com`)

## License

MIT
