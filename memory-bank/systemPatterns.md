# System Patterns: AI GTM Readiness Analyzer

## Architecture Overview
- **Frontend:** Next.js App Router application with React Server Components by default
- **Backend:** Next.js API Routes (preferred) with legacy Express.js routes
- **Database:** PostgreSQL with Drizzle ORM
- **Deployment:** Vercel for both frontend and backend

## Key Technical Decisions
- **Server Components First:** Default to React Server Components, only use Client Components when necessary
- **API Routes:** Next.js API Routes for new endpoints, maintain legacy Express routes as needed
- **Database Abstraction:** All database operations through server/storage.ts
- **Type Safety:** Strict TypeScript with shared types from shared/schema.ts

## Design Patterns
- **Frontend:**
  - Server Components for static/dynamic rendering
  - Client Components for interactive UI
  - Zustand/TanStack React Query for state management
- **Backend:**
  - Repository pattern via server/storage.ts
  - Drizzle ORM for database operations
  - Type-safe API routes with shared types
- **API:** REST principles with Next.js API Routes

## Core Components
- **User Interface:**
  - Next.js App Router pages and layouts
  - Shadcn UI components
  - Tailwind CSS styling
- **Authentication:** Next.js authentication patterns
- **Analysis Engine:** Server-side logic in API routes
- **Data Access:** Abstracted through server/storage.ts
- **API Endpoints:** Next.js API Routes in app/api/