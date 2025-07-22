# claude.local.md

This file provides additional local context and detailed project knowledge for Claude Code when working with the AI Roadmap Generator codebase.

## Project Context & Status

### What This Application Does
The AI Roadmap Generator is a comprehensive web application that helps organizations assess their AI readiness and identify opportunities for AI implementation. It guides users through a multi-step assessment wizard and generates detailed reports with prioritized AI recommendations.

### Current State (January 2025)
**What Works Well:**
- Dashboard overview with user-specific data
- Multi-step assessment wizard with robust session management
- Asynchronous report generation (prevents timeout issues)
- Professional PDF export system for executive presentations
- Library management for Job Roles, AI Capabilities, and AI Tools
- Batch processing system for job descriptions and capabilities
- User-specific data access with proper authentication

**Recent Major Fixes:**
- **AI Service Vercel Deployment Fix**: Fixed OpenAI API calls being skipped in production
- **Asynchronous Report Generation**: Eliminated timeout errors during report creation
- **Executive PDF Export**: Professional multi-page PDF reports for C-level presentations
- **API Security Hardening**: Enterprise-grade authentication and CSRF protection
- **AI Adoption Score Bug**: Fixed critical scaling bug that was showing dramatically lower scores

## Key Business Logic & Engines

### Prioritization Engine (`server/lib/engines/prioritizationEngine.ts`)
The core business logic that calculates AI opportunity priorities:
- **Value/Effort Matrix**: Evaluates capabilities on business value vs implementation effort
- **Scoring System**: Uses 6 criteria (time savings, quality impact, strategic alignment, data readiness, technical feasibility, adoption risk)
- **Heatmap Generation**: Creates visual priority matrices for reports
- **OpenAI Integration**: Uses AI to enhance prioritization with contextual analysis

### Assessment Scoring (`shared/scoring.ts`)
Multi-step assessment scoring logic:
- **Wizard Steps**: Basics, roles, departments, pain points, tech stack, goals
- **Role-Based Scoring**: Maps capabilities to job roles with context-aware weighting
- **Session Management**: Robust state management with dual storage strategy

### Report Service (`server/lib/services/reportService.ts`)
Centralized report generation with:
- **Executive Summary Generation**: AI-powered summaries tailored to company context
- **Capability Recommendations**: Role-specific AI implementation suggestions
- **Performance Impact Predictions**: ROI calculations and improvement metrics
- **Deterministic Output**: Uses assessment ID as seed for consistent AI responses

## Architecture Deep Dive

### Client-Server Component Pattern
**Established Pattern for UI Features:**

1. **Server Components** (`app/(app)/[feature]/page.tsx`):
   ```typescript
   // Data fetching only, minimal UI
   export default async function ReportsPage() {
     const reports = await storage.listReportsForUser(userId);
     const assessments = await storage.listAssessmentsForUser(userId);
     return <ReportsTable reports={reports} assessments={assessments} />;
   }
   ```

2. **Client Components** (`app/(app)/[feature]/ComponentName.tsx`):
   ```typescript
   'use client';
   // Full UI rendering with interactivity, hooks, state
   export function ReportsTable({ reports, assessments }) {
     // Shadcn UI components, hooks, state management
   }
   ```

**Key Implementations:**
- Dashboard: `page.tsx` + `DashboardContent.tsx`
- Reports: `page.tsx` + `ReportsTable.tsx`
- Current Assessments: `page.tsx` + `CurrentAssessmentsTable.tsx`

### Session Management Architecture
**Location**: `lib/session/`

**Core Components:**
- **SessionProvider** (`SessionContext.tsx`): React Context wrapper with `useSession` hook
- **sessionReducer** (`sessionReducer.ts`): Centralized state management with `useReducer`
- **Middleware Layer**:
  - `AutoSaveMiddleware.ts`: Debounced auto-save to browser storage
  - `SessionValMiddleware.ts`: Synchronous validation for step navigation
- **Dual Storage** (`SessionStorageManager.ts`):
  - `sessionStorage`: Transient wizard state (cleared on tab close)
  - `localStorage`: Persistent cache with expiration (departments/roles)

### API Security Architecture
**Middleware System** (`app/api/middleware.ts`):
- **`withAuth`**: Validates Supabase sessions, maps UUIDs to internal user IDs
- **`withCsrf`**: CSRF token validation for state-changing operations
- **`withAuthAndSecurity`**: Combined authentication and CSRF protection

**User Identity Mapping:**
- Challenge: Supabase uses UUID auth IDs, internal DB uses integer user IDs
- Solution: Automatic user profile creation linking `auth_id` to internal `user_id`
- Auto-creation of user profiles on first login

### Database Schema Key Points

**Core Tables:**
- `assessments`: Links to organizations and users, stores wizard `step_data` as JSONB
- `reports`: Generated from assessments, includes executive summaries and AI analysis
- `user_profiles`: Maps Supabase auth UUIDs to internal integer IDs
- `organizations`: Company context for assessments

**AI/Library Tables:**
- `ai_capabilities`: Global AI capability definitions with default scoring
- `assessment_ai_capabilities`: Assessment-specific capability scoring and context
- `ai_tools`: Tool library with categorization
- `capability_tool_mapping`: Many-to-many relationship for tool recommendations

**Batch Processing Tables:**
- `job_descriptions`: Scraped job postings for capability extraction
- `job_scraper_configs`: Configuration for automated job scraping

## Critical Development Patterns

### OpenAI API Integration
**Service Location**: `server/lib/services/aiService.ts`

**Key Functions:**
1. `generateEnhancedExecutiveSummary()`: Company-specific executive summaries
2. `generateAICapabilityRecommendations()`: Role-based AI implementation suggestions
3. `generatePerformanceImpact()`: ROI predictions and improvement metrics

**Error Handling**: All OpenAI calls have fallback templates for production resilience

**Vercel Environment Detection**: 
```typescript
// Fixed detection logic
const isVercelBuild = process.env.VERCEL && process.env.NEXT_PHASE === 'phase-production-build';
```

### Batch Processing System
**Location**: `server/batch-processing/`

**Key Commands:**
```bash
# Job processing workflow
npx tsx server/batch-processing/batchProcessor.ts scrape-jobs
npx tsx server/batch-processing/batchProcessor.ts export-jobs
npx tsx server/batch-processing/batchProcessor.ts process-jobs <response_file>

# Capability processing workflow  
npx tsx server/batch-processing/batchProcessor.ts export-capabilities
npx tsx server/batch-processing/batchProcessor.ts process-tools <response_file>
```

**Features:**
- Incremental processing (tracks processed items)
- OpenAI batch API integration
- Capability rationalization and deduplication
- Job role matching for AI capabilities

### Testing Architecture
- **Unit Tests**: Jest (`tests/` directory)
- **E2E Tests**: Playwright (`tests/e2e/`)
- **API Tests**: `tests/api/reports-api.test.ts`
- **Authentication Tests**: `tests/login/reports-auth.spec.ts`

**E2E Test Organization:**
- Named after business case studies (e.g., `BrightPathAcademy_PROD.spec.ts`)
- Tests full workflow from assessment creation to report generation

## Development Workflow Recommendations

### Database Changes
1. Modify schema in `shared/schema.ts` using Drizzle syntax
2. Run `npm run db:push` to apply changes
3. **Never** auto-generate SQL files - use Drizzle's migration sequence

### Adding New Features
1. Create server component for data fetching (`page.tsx`)
2. Create client component for UI/interactivity (`ComponentName.tsx`)
3. Use storage abstraction layer for all database operations
4. Implement API routes in `app/api/` with proper middleware

### Security Considerations
- All API routes must use appropriate middleware (`withAuth`, `withAuthAndSecurity`)
- User data isolation enforced at storage layer
- CSRF protection required for state-changing operations
- Environment variable validation for production deployments

## Known Issues & Technical Debt

### Current Limitations
- Mobile responsiveness needs enhancement across application
- Performance optimization needed for reports with large datasets
- Legacy patterns in `client/src/` should be migrated to App Router

### Monitoring Points
- OpenAI API rate limits and error rates
- Report generation performance (currently 5-10 minutes)
- Database query performance for large organizations
- Session storage size limits in browser

## Database Management & Deployment Infrastructure

### Database Schema Management - CRITICAL RULES
**⚠️ IMPORTANT**: Database schema updates require explicit user approval and cannot be made automatically.

**Schema Update Workflow:**
1. **NO AUTOMATIC SCHEMA UPDATES**: Never make database schema changes without checking with the user first
2. **Drizzle Kit Commands**: Only the user should run `drizzle-kit generate` and `drizzle-kit migrate` commands
3. **Avoid `npm run db:push`**: This command bypasses proper migration tracking and should not be used
4. **Manual Configuration**: `drizzle.config.ts` is manually configured by the user to target specific environments

**Migration File Organization:**
- `migrations-local/`: Local development database migrations
- `migrations-preview/`: Preview environment database migrations  
- `migrations-vercel/`: Production environment database migrations
- Each environment maintains its own migration history and journal

### Deployment Architecture

**Production Environment:**
- **Platform**: Vercel hosting with serverless functions
- **Trigger**: Automatic deployment on Git push to respective branches
- **Environments**: 
  - Production environment (main/production branch)
  - Preview environments (feature branches)

**Database Infrastructure:**
- **Provider**: NEON serverless PostgreSQL
- **Configuration**: Each Vercel environment instance links to its corresponding NEON database
- **Environment Isolation**: Production, preview, and local databases are completely separate

### Authentication & User Management

**Authentication Provider:**
- **Service**: Supabase Auth
- **Methods**: GitHub OAuth, email/password authentication
- **Session Management**: Server-side cookies with automatic refresh

**User Profile Integration:**
- **Linking Table**: `user_profiles` PostgreSQL table bridges Supabase Auth and internal application
- **Identity Mapping**: Supabase UUID `auth_id` maps to internal integer `user_id`
- **Auto-Creation**: User profiles automatically created on first authentication
- **Data Isolation**: All user data (assessments, reports) properly isolated by `user_id`

**Architecture Flow:**
```
Supabase Auth (UUID) → user_profiles.auth_id → user_profiles.id (integer) → Application Data
```

This infrastructure ensures secure, scalable authentication while maintaining clean separation between auth provider and application data models.

## Development Environment Requirements

**Required Manual Configuration:**
- Environment-specific `drizzle.config.ts` setup
- NEON database connection strings for each environment
- Supabase project configuration and API keys
- Vercel environment variable configuration

**User-Controlled Processes:**
- Database schema changes and migration generation
- Environment-specific deployments and database targeting
- Production database access and maintenance

This local context provides the deep technical and business knowledge needed to work effectively with this mature, production-ready codebase.