# TayAI Project - Development Environment

## Project Overview

TayAI is a custom-trained AI assistant that embodies the voice, expertise, and persona of the TaysLuxe brand owner. This project includes:

- Custom AI Persona with GPT-4
- RAG (Retrieval-Augmented Generation) architecture with Pinecone
- JWT-based authentication and role-based access control
- Usage tracking and rate limiting
- Branded chat interface (React/Next.js)
- Admin dashboard

## Quick Start

1. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and credentials
   ```

2. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Detailed Setup

For complete setup instructions, see [SETUP.md](./SETUP.md)

## Project Structure

```
tayai-project/
├── backend/          # FastAPI backend application
│   ├── app/         # Main application code
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # Next.js frontend application
│   ├── app/         # Next.js app directory
│   ├── components/  # React components
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
└── SETUP.md
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose (recommended)
- PostgreSQL 14+ (if not using Docker)
- Redis 7+ (if not using Docker)
- OpenAI API key with GPT-4 access
- Pinecone account and API key

## Key Features

### Backend (FastAPI)
- `/api/v1/chat/` - Chat endpoint with RAG
- `/api/v1/auth/login` - User authentication
- `/api/v1/auth/verify` - Token verification
- `/api/v1/usage/` - Usage limits checking
- `/api/v1/admin/knowledge` - Knowledge base management

### Frontend (Next.js)
- Chat widget component with real-time messaging
- Authentication flow
- Usage dashboard
- Admin panel (future)

## Development URLs

- Backend API: http://localhost:8000
- Backend API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Development Workflow

1. **Week 1**: Discovery & Architecture ✅
2. **Week 2**: Core AI Build (RAG, GPT-4 integration)
3. **Week 3**: Access Control & Interface
4. **Week 4**: Integration & Testing

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Documentation

- **Setup Guide**: See [SETUP.md](./SETUP.md) for detailed setup instructions
- **API Documentation**: Available at http://localhost:8000/docs when backend is running
- **Project Scope**: See the full scope document for requirements

## Support

For questions or issues, refer to the setup guide or contact the development team.
