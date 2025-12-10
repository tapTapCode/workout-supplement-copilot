# Workout & Supplement Copilot - Design Document

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 16 (React 19, TypeScript)                       │  │
│  │  - Pages: /, /workouts, /copilot, /auth                  │  │
│  │  - Components: WorkoutForm, WorkoutList, Navigation      │  │
│  │  - API Client: REST calls to backend                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST API
                             │ (JWT Authentication)
┌────────────────────────────▼────────────────────────────────────┐
│                      Backend Layer                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js API Server (Node.js 18+)                     │  │
│  │  - Routes: /api/auth, /api/workouts, /api/copilot        │  │
│  │  - Middleware: Auth, Rate Limiting, Audit Logging         │  │
│  │  - Services: Workout, Copilot, Compliance, Validation     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LangGraph Workflow (AI Copilot)                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │ Gather  │→ │Generate  │→ │Check     │              │  │
│  │  │ Context │  │Candidates│  │Compliance│              │  │
│  │  └──────────┘  └──────────┘  └────┬─────┘              │  │
│  │                                    │                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────▼─────┐              │  │
│  │  │Generate  │← │Validate  │← │Save      │              │  │
│  │  │Reasoning │  │Final     │  │Recommend │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌─────────▼─────────┐  ┌─────▼──────────┐
│   PostgreSQL   │  │   OpenAI API      │  │  External      │
│   (Supabase)   │  │   (GPT-4)         │  │  Services      │
│                │  │                   │  │                │
│  - users       │  │  - LLM Inference  │  │  - Future:     │
│  - workouts    │  │  - Embeddings     │  │    FDA API     │
│  - exercises   │  │                   │  │    Webhooks    │
│  - supplements │  │                   │  │                │
│  - compliance  │  │                   │  │                │
│  - citations   │  │                   │  │                │
└────────────────┘  └───────────────────┘  └────────────────┘
```

## Data Model (ERD)

### Core Entities

```
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR, nullable)
├── created_at
└── updated_at

workouts
├── id (BIGSERIAL, PK)
├── user_id (UUID, FK → users.id)
├── name (VARCHAR)
├── description (TEXT)
├── created_at
└── updated_at

exercises
├── id (UUID, PK)
├── workout_id (BIGINT, FK → workouts.id)
├── name (VARCHAR)
├── muscle_groups (TEXT[])
├── equipment (VARCHAR)
├── instructions (TEXT)
├── order_index (INTEGER)
└── created_at

exercise_sets
├── id (UUID, PK)
├── exercise_id (UUID, FK → exercises.id)
├── sets (INTEGER)
├── reps (INTEGER)
├── weight (DECIMAL)
├── duration_seconds (INTEGER)
├── rest_seconds (INTEGER)
├── order_index (INTEGER)
└── created_at

workout_schedules
├── id (UUID, PK)
├── workout_id (BIGINT, FK → workouts.id)
├── user_id (UUID, FK → users.id)
├── day_of_week (INTEGER, 0-6)
├── time_of_day (TIME)
├── is_active (BOOLEAN)
├── created_at
└── updated_at
```

### Supplement & Compliance Entities

```
supplements
├── id (UUID, PK)
├── name (VARCHAR, UNIQUE)
├── brand (VARCHAR)
├── description (TEXT)
├── category (VARCHAR)
├── created_at
└── updated_at

supplement_ingredients
├── id (UUID, PK)
├── supplement_id (UUID, FK → supplements.id)
├── ingredient_name (VARCHAR)
├── amount (VARCHAR)
├── order_index (INTEGER)
└── created_at

compliance_records
├── id (UUID, PK)
├── ingredient_name (VARCHAR)
├── status (VARCHAR: approved|pending|restricted|banned|unknown)
├── fda_status (TEXT)
├── source_url (TEXT)
├── source_authority (VARCHAR, default: 'FDA')
├── last_verified_at (TIMESTAMP)
├── notes (TEXT)
├── created_at
└── updated_at
UNIQUE(ingredient_name, source_authority)
```

### Recommendation Entities

```
copilot_recommendations
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── workout_id (BIGINT, FK → workouts.id, nullable)
├── recommendation_text (TEXT)
├── reasoning (TEXT)
└── created_at

recommendation_supplements
├── id (UUID, PK)
├── recommendation_id (UUID, FK → copilot_recommendations.id)
├── supplement_id (UUID, FK → supplements.id)
└── created_at
UNIQUE(recommendation_id, supplement_id)

recommendation_citations
├── id (UUID, PK)
├── recommendation_id (UUID, FK → copilot_recommendations.id)
├── ingredient_name (VARCHAR)
├── compliance_record_id (UUID, FK → compliance_records.id, nullable)
├── citation_text (TEXT)
├── source_url (TEXT)
└── created_at
```

### Audit Entity

```
audit_logs
├── id (UUID, PK)
├── user_id (UUID, FK → users.id, nullable)
├── action (VARCHAR)
├── resource_type (VARCHAR)
├── resource_id (UUID)
├── details (JSONB)
├── ip_address (INET)
└── created_at
```

## API Specification

### Base URL
- Development: `http://localhost:3001`
- Production: `https://api.workout-copilot.com`

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication

**POST /api/auth/signup**
- **Auth**: None
- **Body**: `{ email: string, password: string }`
- **Response**: `{ data: { token: string, user: { id, email } } }`
- **Errors**: 400 (validation), 409 (user exists), 500

**POST /api/auth/login**
- **Auth**: None
- **Body**: `{ email: string, password: string }`
- **Response**: `{ data: { token: string, user: { id, email } } }`
- **Errors**: 400 (validation), 401 (invalid credentials), 500

**POST /api/auth/demo** (backward compatibility)
- **Auth**: None
- **Body**: `{ email: string }`
- **Response**: `{ data: { token: string, user: { id, email } } }`

#### Workouts

**GET /api/workouts**
- **Auth**: Required
- **Query**: `?page=1&limit=10`
- **Response**: `{ data: { items: Workout[], total: number, totalPages: number } }`

**GET /api/workouts/:id**
- **Auth**: Required
- **Response**: `{ data: Workout }` (includes exercises, sets)
- **Errors**: 404

**POST /api/workouts**
- **Auth**: Required
- **Body**: `{ name: string, description?: string, exercises?: Exercise[] }`
- **Response**: `{ data: Workout }`
- **Errors**: 400 (validation), 500

**PUT /api/workouts/:id**
- **Auth**: Required
- **Body**: `{ name?: string, description?: string }`
- **Response**: `{ data: Workout }`
- **Errors**: 404, 500

**DELETE /api/workouts/:id**
- **Auth**: Required
- **Response**: `{ data: { success: boolean } }`
- **Errors**: 404, 500

**POST /api/workouts/:id/schedule**
- **Auth**: Required
- **Body**: `{ day_of_week: number (0-6), time_of_day?: string (HH:MM) }`
- **Response**: `{ data: { schedule: WorkoutSchedule } }`
- **Errors**: 400, 404, 500

**GET /api/workouts/schedules/all**
- **Auth**: Required
- **Response**: `{ data: { schedules: WorkoutSchedule[] } }`

#### Copilot

**POST /api/copilot/recommend**
- **Auth**: Required
- **Body**: `{ workout_id?: string, user_goals?: string[], health_conditions?: string[] }`
- **Response**: `{ data: { recommendation: CopilotRecommendation } }`
- **Response includes**: `recommendation_text`, `reasoning`, `citations[]`
- **Errors**: 400 (validation), 500
- **Rate Limit**: 10 requests/hour per user

**GET /api/copilot/recommendations**
- **Auth**: Required
- **Query**: `?page=1&limit=10`
- **Response**: `{ data: { items: CopilotRecommendation[], total: number } }`

**GET /api/copilot/recommendations/:id**
- **Auth**: Required
- **Response**: `{ data: CopilotRecommendation }` (includes citations)

#### Supplements

**GET /api/supplements**
- **Auth**: Required
- **Query**: `?page=1&limit=10&category=?&search=?`
- **Response**: `{ data: { items: Supplement[], total: number } }`

**GET /api/supplements/:id**
- **Auth**: Required
- **Response**: `{ data: Supplement }` (includes ingredients)

**GET /api/supplements/:id/compliance**
- **Auth**: Optional
- **Response**: `{ data: { supplement: Supplement, compliance: ComplianceRecord[] } }`

#### Compliance

**GET /api/compliance/ingredient/:name**
- **Auth**: Required
- **Response**: `{ data: ComplianceRecord[] }`
- **Errors**: 404

**POST /api/compliance/verify**
- **Auth**: Required
- **Body**: `{ ingredient_name: string, status: 'approved'|'pending'|'restricted'|'banned'|'unknown', source_authority: string, fda_status?: string, source_url?: string, notes?: string }`
- **Response**: `{ data: ComplianceRecord }`

### Response Format

All responses follow this structure:
```typescript
{
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

## AI Flow (LangGraph)

### Workflow Graph

```
START
  │
  ▼
┌─────────────────┐
│ gatherContext   │  Load workout, user goals, health conditions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ generateCandidates│  LLM generates supplement candidates
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ checkCompliance │  Filter by FDA compliance (approved/pending only)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    │    [Has compliant supplements?]
    │         │
    │    NO   │ YES
    │         │
    ▼         ▼
   END   ┌─────────────────┐
         │ generateReasoning│  LLM explains recommendations
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ validateFinal    │  Final safety check
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ saveRecommendation│  Save to database with citations
         └────────┬────────┘
                  │
                  ▼
                 END
```

### Step Details

#### 1. gatherContext
- Loads workout details (if `workout_id` provided)
- Extracts muscle groups, exercise types
- Prepares user goals and health conditions
- **Output**: Enriched context for LLM

#### 2. generateCandidates
- **LLM Model**: GPT-4 Turbo
- **Prompt Strategy**:
  ```
  Based on workout/goals, recommend supplements with:
  - Only FDA-approved ingredients
  - Specific to muscle groups worked
  - Consider health conditions
  - Include ingredient lists
  ```
- **Output**: Array of candidate supplements with ingredients
- **Guardrails**: 
  - Explicitly instructs LLM to use only well-known FDA-approved ingredients
  - Validates supplement structure before proceeding

#### 3. checkCompliance
- For each ingredient in candidates:
  - Query `compliance_records` table (FDA authority)
  - Check status: `approved` or `pending` only
  - Reject if: `banned`, `restricted`, or `unknown`
- **Filtering Logic**:
  - Removes supplements with ANY non-compliant ingredient
  - Only keeps supplements where ALL ingredients are approved/pending
- **Output**: Filtered supplements + compliance check results
- **Guardrails**:
  - Database-backed compliance checking (not LLM-generated)
  - Strict filtering: all ingredients must have approved/pending status

#### 4. generateReasoning
- **LLM Model**: GPT-4 Turbo
- **Prompt Strategy**:
  ```
  Explain why each supplement is recommended:
  1. How it supports workout goals
  2. When to take it (pre/post/during)
  3. Expected benefits
  4. Precautions
  ```
- **Citation Generation**:
  - For each ingredient in filtered supplements:
    - Lookup compliance record
    - Generate citation: `"FDA: approved - GRAS (notes)"`
    - Include `source_url` and `compliance_record_id`
- **Output**: 
  - `recommendation_text`: Overall recommendation
  - `reasoning`: Detailed explanation per supplement
  - `citations[]`: One citation per ingredient with compliance status

#### 5. validateFinal
- Double-checks all ingredients are approved/pending
- Verifies no banned/restricted/unknown ingredients slipped through
- **Guardrails**: Final safety net before saving

#### 6. saveRecommendation
- Saves recommendation to `copilot_recommendations`
- Saves citations to `recommendation_citations`
- Links supplements via `recommendation_supplements`
- **Output**: Saved recommendation with full citation chain

### Prompt Strategy

**Key Principles**:
1. **Explicit FDA Compliance**: Prompts explicitly instruct LLM to use only FDA-approved ingredients
2. **Structured Output**: Uses format markers (`RECOMMENDATION:`, `REASONING:`) for parsing
3. **Context-Rich**: Includes workout details, muscle groups, user goals
4. **Safety-First**: Multiple validation layers (LLM instruction + database filtering + final validation)

**Example Prompt** (generateCandidates):
```
You are a supplement recommendation system. Recommend supplements for:
Workout: {workout.name}
Muscle Groups: {muscle_groups}
User Goals: {user_goals}

IMPORTANT: Use only well-known, commonly FDA-approved ingredients.
Examples: Whey Protein, Creatine, Beta-Alanine, BCAA, L-Glutamine

For each supplement, provide:
- Name
- Category
- Reason (why it helps)
- Ingredients (list of ingredient names)

Avoid obscure or proprietary ingredient names.
```

### Guardrails

1. **Database Compliance Check**: All ingredients verified against `compliance_records` table
2. **Strict Filtering**: Only approved/pending ingredients allowed
3. **Final Validation**: Double-check before saving
4. **Citation Requirement**: Every ingredient must have a citation (with compliance record ID)
5. **Rate Limiting**: 10 requests/hour per user
6. **Error Handling**: Graceful failures with clear error messages

### Source Citation

**How Citations Work**:
1. After compliance check, each ingredient has a compliance record lookup
2. Citation generated with format:
   ```
   "FDA: approved - GRAS (Generally Recognized as Safe)"
   ```
3. Includes:
   - `compliance_record_id`: Links to `compliance_records.id`
   - `source_url`: FDA source URL (if available)
   - `citation_text`: Human-readable compliance status
4. Saved to `recommendation_citations` table
5. Returned with recommendation for frontend display

**Citation Example**:
```json
{
  "ingredient_name": "Whey Protein",
  "citation_text": "FDA: approved - GRAS (Generally Recognized as Safe)",
  "source_url": "https://www.fda.gov/...",
  "compliance_record_id": "uuid-here"
}
```

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js 18+, TypeScript
- **Database**: PostgreSQL (Supabase)
- **AI**: LangChain, LangGraph, OpenAI GPT-4 Turbo
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Deployment**: Vercel (frontend), AWS Lambda (backend via Serverless Framework)

## Security

- JWT authentication with 7-day expiration
- Password hashing (bcrypt, 10 salt rounds)
- Rate limiting (IP-based and user-based)
- CORS protection
- SQL injection prevention (parameterized queries)
- Audit logging for all API actions
- Input validation (Zod schemas)

## Compliance Strategy

### How We Determine Ingredient Compliance

**Data Sources**:
- Primary: `compliance_records` table in PostgreSQL
- Authority: FDA (default), extensible to other regulatory bodies
- Status values: `approved`, `pending`, `restricted`, `banned`, `unknown`

**Decision Logic**:
1. **Approved**: Ingredient has FDA approval (GRAS, approved food additive, etc.) → ✅ **ALLOW**
2. **Pending**: Ingredient is under FDA review → ✅ **ALLOW** (with note in citation)
3. **Restricted**: Ingredient has usage restrictions → ❌ **REJECT**
4. **Banned**: Ingredient is prohibited by FDA → ❌ **REJECT**
5. **Unknown**: No compliance record found → ❌ **REJECT** (strict mode)

**Handling Uncertainty**:
- **Unknown ingredients**: Rejected by default (strict compliance)
- **Missing data**: Supplement filtered out if ANY ingredient lacks approved/pending status
- **Multiple authorities**: System supports multiple `source_authority` values (FDA, EU, etc.)
- **Manual verification**: Citations include warnings for ingredients requiring healthcare consultation

**Compliance Check Flow**:
```
1. LLM generates candidate supplements with ingredients
2. For each ingredient → Query compliance_records table
3. Filter supplements: Keep only if ALL ingredients are approved/pending
4. Generate citations linking to compliance_record_id
5. Final validation: Double-check before saving
```

**Data Maintenance**:
- Compliance records can be added/updated via `/api/compliance/verify` endpoint
- Supports bulk import for FDA GRAS list, approved additives, etc.
- `last_verified_at` timestamp tracks data freshness
- `source_url` links to official FDA documentation

## Deployment & DevOps

### Infrastructure

**Frontend (Vercel)**:
- Framework: Next.js 16 (static + server-rendered)
- Build: Automatic on git push to main
- Environment: `.env.local` for `NEXT_PUBLIC_API_URL`
- Domain: Custom domain via Vercel DNS
- Rollback: Vercel dashboard → Deployments → Promote previous version

**Backend (AWS Lambda)**:
- Framework: Serverless Framework
- Runtime: Node.js 18.x
- Memory: 512MB
- Timeout: 30 seconds
- Deployment: `serverless deploy --stage prod`
- Rollback: `serverless rollback --timestamp <timestamp>`

**Database (Supabase)**:
- Managed PostgreSQL
- Connection: Connection pooling via Supabase connection string
- Backups: Automatic daily backups (Supabase managed)
- Migrations: SQL scripts in `docs/` folder, run via Supabase SQL Editor

### Logging & Monitoring

**Frontend**:
- Vercel Analytics (automatic)
- Error tracking: Next.js error boundaries
- Console logs for development

**Backend**:
- CloudWatch Logs (AWS Lambda automatic)
- Log levels: `console.log`, `console.error`, `console.warn`
- Audit logs: Stored in `audit_logs` table (all API actions)

**Monitoring**:
- Health check: `GET /health` endpoint
- Database connection: Checked on startup
- LLM API errors: Logged with full context

### Deployment Process

1. **Frontend**:
   ```bash
   git push origin main
   # Vercel automatically builds and deploys
   ```

2. **Backend**:
   ```bash
   cd backend
   npm run build
   serverless deploy --stage prod
   ```

3. **Database**:
   - Run migration SQL in Supabase SQL Editor
   - Test in staging environment first

## Security & Privacy

### Authentication & Authorization

**Authentication (AuthN)**:
- JWT tokens (7-day expiration)
- Password hashing: bcrypt (10 salt rounds)
- Token storage: `localStorage` (frontend)
- Token validation: Middleware on all protected routes

**Authorization (AuthZ)**:
- User-scoped data: All queries filter by `user_id`
- Workout ownership: Users can only access their own workouts
- Recommendations: Users can only view their own recommendations
- Admin endpoints: TODO - Add role-based access control

### PII Boundaries

**Stored PII**:
- Email address (users table)
- Password hash (users table, never plaintext)
- User ID (all tables, for data isolation)

**Not Stored**:
- IP addresses (only in audit_logs, not linked to user accounts)
- Health conditions (only in request, not persisted)
- Personal details beyond email

**Data Isolation**:
- All queries include `WHERE user_id = $1` filter
- Foreign keys enforce user ownership
- CASCADE deletes ensure data cleanup

### Secrets Handling

**Environment Variables**:
- Backend: `.env` file (never committed)
- Frontend: `.env.local` (only `NEXT_PUBLIC_*` variables)
- Production: AWS Lambda environment variables (encrypted)
- Supabase: Connection string in environment variables

**Secrets**:
- `JWT_SECRET`: 32-byte random hex (generated via script)
- `OPENAI_API_KEY`: Stored in environment, never logged
- `DATABASE_URL`: Supabase connection string (encrypted in transit)

### Rate Limiting & Abuse Prevention

**Rate Limits**:
- IP-based: 100 requests/minute (all endpoints)
- User-based: 10 requests/hour (Copilot recommendations)
- Implementation: `express-rate-limit` middleware

**Abuse Prevention**:
- Input validation: Zod schemas on all endpoints
- SQL injection: Parameterized queries only
- XSS protection: React escapes by default
- CORS: Whitelist specific origins
- Audit logging: All actions logged for forensics

## Costs & Performance

### LLM Usage

**Model**: OpenAI GPT-4 Turbo
**Usage**:
- `generateCandidates`: ~500-1000 tokens input, ~300-500 tokens output
- `generateReasoning`: ~800-1500 tokens input, ~500-800 tokens output
- **Total per recommendation**: ~2000-3500 tokens
- **Cost estimate**: ~$0.01-0.02 per recommendation (GPT-4 Turbo pricing)

**Optimization**:
- Prompt engineering: Concise, structured prompts
- Response parsing: JSON format for faster parsing
- Error handling: Retry logic for transient failures

### Caching Strategy

**Current**:
- No caching implemented (future optimization)

**Future Opportunities**:
- Compliance records: Cache in-memory (rarely change)
- Workout data: Cache user's recent workouts
- Recommendations: Cache by workout_id + user_goals hash

### Batching

**Current**:
- Compliance checks: Parallel `Promise.all()` for multiple ingredients
- Database queries: Batch where possible

**Future**:
- Batch compliance lookups for multiple recommendations
- Batch citation generation

### Cold Starts (AWS Lambda)

**Impact**:
- First request: ~2-3 seconds (Lambda cold start)
- Subsequent requests: ~200-500ms

**Mitigation**:
- Provisioned concurrency (future): Keep 1-2 instances warm
- Connection pooling: Reuse database connections
- Keep-alive: Maintain connections between invocations

### Database Indexes

**Existing Indexes**:
- `idx_workouts_user_id`: Fast user workout queries
- `idx_compliance_records_ingredient_name`: Fast ingredient lookups
- `idx_compliance_records_status`: Fast status filtering
- `idx_copilot_recommendations_user_id`: Fast recommendation history

**Performance**:
- Query time: <50ms for most queries
- Compliance lookup: <10ms (indexed by ingredient_name)
- Pagination: Efficient with LIMIT/OFFSET

## Work Plan (30-Day Milestones)

### Week 1: Foundation & Testing
- ✅ Database schema deployed
- ✅ Authentication working (signup/login)
- ✅ Workout CRUD operations
- ✅ Basic Copilot flow
- **Next**: End-to-end testing, bug fixes

### Week 2: Compliance & Citations
- ✅ Compliance checking implemented
- ✅ Citation generation working
- ✅ Strict filtering (approved/pending only)
- **Next**: Seed compliance database with common ingredients

### Week 3: UI/UX Polish
- ✅ Dark mode implemented
- ✅ Navigation with auth state
- ✅ Schedule UI added
- **Next**: Error handling improvements, loading states

### Week 4: Deployment & Production Readiness
- **Deploy frontend to Vercel**
- **Deploy backend to AWS Lambda**
- **Set up monitoring and alerts**
- **Load testing and performance tuning**
- **Documentation finalization**

### Key Deliverables
1. Production-ready application deployed
2. Compliance database seeded with 50+ common ingredients
3. Monitoring dashboard (CloudWatch + Vercel Analytics)
4. User documentation and API docs
5. Backup and disaster recovery plan

