# TayAI Project - Development Environment Setup Guide

## Overview

This guide will help you set up the complete development environment for the TayAI project. The project consists of:

- **Backend**: FastAPI (Python) with PostgreSQL, Redis, OpenAI, and Pinecone
- **Frontend**: Next.js (React/TypeScript) with Tailwind CSS
- **Infrastructure**: Docker Compose for local development

## Prerequisites

Before starting, ensure you have the following installed:

1. **Python 3.11+**
   ```bash
   python --version  # Should be 3.11 or higher
   ```

2. **Node.js 18+**
   ```bash
   node --version  # Should be 18 or higher
   ```

3. **Docker and Docker Compose**
   ```bash
   docker --version
   docker-compose --version
   ```

4. **Git** (for version control)

5. **API Keys and Accounts**:
   - OpenAI API key with GPT-4 access
   - Pinecone account and API key
   - (Optional) Sentry account for error tracking

## Step-by-Step Setup

### Step 1: Clone and Navigate to Project

```bash
cd /Users/jumar.juaton/tayai-project
```

### Step 2: Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your credentials:
   ```bash
   # Required: OpenAI
   OPENAI_API_KEY=sk-your-openai-key-here
   OPENAI_MODEL=gpt-4
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small

   # Required: Pinecone
   PINECONE_API_KEY=your-pinecone-key-here
   PINECONE_ENVIRONMENT=us-east-1-aws  # Your Pinecone environment
   PINECONE_INDEX_NAME=tayai-knowledge-base

   # Database (defaults work for Docker)
   DATABASE_URL=postgresql://tayai_user:tayai_password@postgres:5432/tayai_db
   POSTGRES_USER=tayai_user
   POSTGRES_PASSWORD=tayai_password
   POSTGRES_DB=tayai_db

   # Redis (defaults work for Docker)
   REDIS_URL=redis://redis:6379

   # JWT Secret (CHANGE IN PRODUCTION!)
   JWT_SECRET_KEY=your-super-secret-key-change-in-production

   # Frontend URLs
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

### Step 3: Set Up Pinecone Index

1. Log in to your Pinecone account
2. Create a new index:
   - Name: `tayai-knowledge-base`
   - Dimensions: `1536` (for text-embedding-3-small) or `3072` (for text-embedding-3-large)
   - Metric: `cosine`
   - Environment: Your chosen environment

### Step 4: Start Services with Docker Compose (Recommended)

This is the easiest way to get everything running:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 8000
- Frontend on port 3000

### Step 5: Manual Setup (Alternative)

If you prefer to run services manually:

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (if using Alembic)
# alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Database Setup (Manual)

If not using Docker, you'll need to set up PostgreSQL and Redis manually:

1. **PostgreSQL**:
   ```bash
   # Create database
   createdb tayai_db
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE tayai_db;
   CREATE USER tayai_user WITH PASSWORD 'tayai_password';
   GRANT ALL PRIVILEGES ON DATABASE tayai_db TO tayai_user;
   ```

2. **Redis**:
   ```bash
   # Install and start Redis
   redis-server
   ```

### Step 6: Initialize Database

The database tables will be created automatically on first run. However, you may want to create an admin user:

```bash
# You can use the API or create a script to add users
# Example: Use the /api/v1/auth/login endpoint after creating a user
```

### Step 7: Verify Installation

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status": "healthy"}
   ```

2. **Backend API Docs**:
   Open http://localhost:8000/docs in your browser

3. **Frontend**:
   Open http://localhost:3000 in your browser

## Project Structure

```
tayai-project/
├── backend/
│   ├── app/
│   │   ├── api/           # API routes and endpoints
│   │   ├── core/          # Configuration and utilities
│   │   ├── db/            # Database models and setup
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── main.py        # FastAPI application entry
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── lib/               # Utilities and API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Development Workflow

### Running Tests

**Backend**:
```bash
cd backend
pytest
```

**Frontend**:
```bash
cd frontend
npm test
```

### Code Formatting

**Backend**:
```bash
cd backend
black app/
flake8 app/
```

**Frontend**:
```bash
cd frontend
npm run lint
```

### Database Migrations

If using Alembic for migrations:

```bash
cd backend
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## Common Issues and Solutions

### Issue: Port already in use

**Solution**: Change ports in `docker-compose.yml` or stop the conflicting service.

### Issue: Database connection errors

**Solution**: 
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database credentials

### Issue: OpenAI API errors

**Solution**:
- Verify OPENAI_API_KEY is set correctly
- Check you have GPT-4 access
- Verify API quota/credits

### Issue: Pinecone connection errors

**Solution**:
- Verify PINECONE_API_KEY and PINECONE_ENVIRONMENT
- Ensure index exists and name matches
- Check index dimensions match embedding model

### Issue: Frontend can't connect to backend

**Solution**:
- Check NEXT_PUBLIC_API_URL in `.env`
- Ensure backend is running on correct port
- Check CORS settings in backend

## Next Steps

1. **Populate Knowledge Base**: Add content to Pinecone using the admin API
2. **Create Test Users**: Set up users with different tiers
3. **Test Chat Flow**: Verify RAG and chat functionality
4. **Configure Monitoring**: Set up Sentry and logging
5. **Deploy to Staging**: Prepare for production deployment

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io/)

## Support

For issues or questions, refer to the project documentation or contact the development team.
