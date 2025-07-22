# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run check

# Start production server
npm start
```

### Database Management
```bash
# Push schema changes to database
npm run db:push

# Push to production database
npm run db:push:prod
```

### Testing
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Show E2E test report
npm run test:e2e:report
```

### Code Quality
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Database & Scripts
```bash
# Setup database environment
npm run db:setup

# Export memory storage
npm run storage:export

# Migrate to PostgreSQL
npm run storage:migrate

# Run web scraper
npm run scraper:run

# Process batch outputs
npm run process:batch
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript with ES Modules
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: React + Tailwind CSS + shadcn/ui
- **State Management**: TanStack React Query + Zustand
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

### Directory Structure

#### Core Directories
- `app/` - Next.js App Router (pages, layouts, API routes)
- `shared/schema.ts` - Database schema and shared types (source of truth)
- `server/` - Backend logic, storage implementations, batch processing
- `components/` - Reusable UI components organized by feature
- `lib/` - Utility functions and client-side helpers

#### Key Files
- `shared/schema.ts` - Database schema definitions using Drizzle ORM
- `server/pg-storage.ts` - PostgreSQL storage implementation
- `server/lib/engines/prioritizationEngine.ts` - AI capability prioritization logic
- `drizzle.config.ts` - Database configuration

### Client-Server Architecture Pattern

The application follows a specific pattern for UI features:

**Server Components** (`app/(app)/[feature]/page.tsx`):
- Handle data fetching with `async`/`await`
- Minimal UI, pass data to client components
- No React hooks, refs, or client-side state

**Client Components** (`app/(app)/[feature]/ComponentName.tsx`):
- Marked with `'use client'` directive
- Handle interactivity, hooks, state management
- Use shadcn/ui components (which require refs)
- Colocated with server components

### API Architecture

All API endpoints use Next.js API Routes in `app/api/`:
- `app/api/assessments/` - Assessment CRUD operations
- `app/api/reports/` - Report generation and management
- `app/api/ai-capabilities/` - AI capability management
- `app/api/ai-tools/` - AI tool management

Database operations go through the storage abstraction layer (`server/storage.ts` → `server/pg-storage.ts`).

## Development Guidelines

### Frontend Development
- Use React Server Components by default
- Only use `'use client'` when interactivity is required
- Leverage TanStack React Query for server state
- Use Zustand for client state when needed
- Follow the colocated Client-Server component pattern
- Use shadcn/ui components for consistency

### Database Development
- All schema changes go in `shared/schema.ts`
- Use Drizzle ORM for all database operations
- Go through `server/storage.ts` abstraction layer
- Run `npm run db:push` to apply schema changes

### Type Safety
- Reference types from `shared/schema.ts`
- Use strict TypeScript practices
- Leverage path aliases:
  - `@/app/*` → `./app/*`
  - `@shared/*` → `./shared/*`
  - `@/server/*` → `./server/*`
  - `@/components/*` → `./components/*`

### Testing
- Unit tests with Jest (`tests/` directory)
- E2E tests with Playwright (`tests/e2e/`)
- API tests in `tests/api/`
- Test authentication flows in `tests/login/`

### Batch Processing System

The application includes a comprehensive batch processing system in `server/batch-processing/`:

```bash
# Job description processing
npx tsx server/batch-processing/batchProcessor.ts scrape-jobs
npx tsx server/batch-processing/batchProcessor.ts export-jobs
npx tsx server/batch-processing/batchProcessor.ts process-jobs <response_file>

# AI capability processing
npx tsx server/batch-processing/batchProcessor.ts export-capabilities
npx tsx server/batch-processing/batchProcessor.ts process-tools <response_file>

# Utilities
npx tsx server/batch-processing/batchProcessor.ts list
npx tsx server/batch-processing/batchProcessor.ts reset-tracking
```

### Key Business Logic

**Prioritization Engine** (`server/lib/engines/prioritizationEngine.ts`):
- Calculates AI opportunity priorities based on value/effort matrix
- Integrates with OpenAI for capability analysis
- Generates heatmaps and recommendations

**Assessment Scoring** (`shared/scoring.ts`):
- Handles multi-step assessment scoring logic
- Supports role-based capability mapping

**Report Generation** (`server/lib/services/reportService.ts`):
- Creates comprehensive AI readiness reports
- Integrates prioritization matrix with business context