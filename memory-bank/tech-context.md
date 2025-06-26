# Tech Context

This document details the technologies, tools, and development environment used in the AI Roadmap project.

## Core Technologies

*   **Runtime:** Node.js (Latest LTS recommended)
*   **Language:** TypeScript (Strict mode enabled)
*   **Framework:** Next.js (using App Router)
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **Component Library:** Shadcn UI (built on Radix UI)
*   **State Management:**
    *   TanStack React Query (for data fetching)
    *   Zustand (for client-side state)
*   **Data Tables:** TanStack Table
*   **Database:** PostgreSQL
*   **ORM:** Drizzle ORM
*   **Form Handling:** React Hook Form with Zod validation
*   **Icons:** Lucide React

## Development Environment

*   **Package Manager:** npm
*   **Module System:** ES Modules (`"type": "module"` in `package.json`)
*   **Code Formatting/Linting:** Prettier & ESLint
*   **Path Aliases:** Configured in `tsconfig.json` for cleaner imports:
    *   `@/app/*` -> `./app/*`
    *   `@shared/*` -> `./shared/*`
    *   `@/server/*` -> `./server/*`
    *   `@/components/*` -> `./components/*`
    *   `@/lib/*` -> `./lib/*`
*   **Starting Dev Server:** `npm run dev`

## Build & Deployment

*   **Build Command:** `npm run build` (executes `next build`)
*   **Deployment Platform:** Vercel
*   **Output Directory:** `.next`
*   **Environment Variables:** Managed via Vercel UI and `.env` files for local development (see `airoadmap.md` for required variables).

## Key Libraries & Tools

*   **`next`:** Core framework
*   **`react` / `react-dom`:** UI rendering
*   **`typescript`:** Language
*   **`tailwindcss`:** CSS framework
*   **`class-variance-authority`:** Flexible component styling
*   **`shadcn-ui` / `radix-ui`:** UI components
*   **`@tanstack/react-table`:** Data tables
*   **`@tanstack/react-query`:** Data fetching
*   **`zustand`:** State management
*   **`drizzle-orm` / `drizzle-kit`:** Database ORM and migration tool
*   **`pg`:** PostgreSQL driver for Node.js
*   **`zod`:** Schema validation
*   **`react-hook-form`:** Form handling
*   **`lucide-react`:** Icon library
*   **`@supabase/supabase-js`:** Authentication and database client

## Authentication & Security Architecture

The application uses Supabase for authentication with a custom middleware security layer:

### Authentication System
*   **Provider:** Supabase Auth with GitHub OAuth and email/password
*   **User Management:** Dual-layer system with Supabase auth and internal user profiles
*   **Session Handling:** Server-side cookies with automatic refresh
*   **CSRF Protection:** Token-based CSRF protection for API routes

### API Security Middleware
*   **Location:** `app/api/middleware.ts`
*   **Authentication Middleware (`withAuth`):**
    - Validates Supabase sessions using server-side cookies
    - Maps Supabase user IDs to internal user profile IDs
    - Auto-creates user profiles for new authenticated users
    - Adds user context to request handlers
*   **CSRF Middleware (`withCsrf`):**
    - Validates CSRF tokens for state-changing operations
    - Integrates with client-side API client for seamless token handling
*   **Combined Middleware (`withAuthAndSecurity`):**
    - Applies both authentication and CSRF protection
    - Used for all protected API routes

### User Profile System
*   **Database Tables:** 
    - `userProfiles` - Internal user records with integer IDs
    - Linked to Supabase auth via `auth_id` (UUID) field
*   **Auto-Creation:** User profiles automatically created on first login
*   **Mapping:** API routes resolve Supabase UUIDs to integer user IDs for database operations

### Client-Side Security
*   **API Client:** `utils/api-client.ts` handles CSRF token injection
*   **Authentication Hook:** `hooks/UseAuth.tsx` manages auth state and CSRF tokens
*   **Token Management:** Automatic CSRF token refresh and injection into API calls

## Client-Server Component Architecture

The application uses Next.js App Router with a clear separation between Server and Client Components:

*   **Server Components (`page.tsx`):**
    *   Handle data fetching (async/await)
    *   Pass data to Client Components
    *   Avoid refs, useState, useEffect, event handlers
    *   More efficient rendering through RSC (React Server Components)

*   **Client Components (marked with `'use client'`):**
    *   Handle interactive UI
    *   Use hooks, state, refs, event handlers
    *   Typically contain Shadcn UI components which require client-side features

*   **Component Files Organization:**
    *   Server Components: `app/(app)/[feature]/page.tsx`
    *   Client Components: `app/(app)/[feature]/[ComponentName].tsx`
    *   Example pairs: `page.tsx` + `ReportsTable.tsx`, `page.tsx` + `DashboardContent.tsx`

## Technical Constraints & Considerations

*   Adherence to Next.js App Router conventions is preferred for new development.
*   Leverage Vercel platform features for deployment, cron jobs, etc.
*   Maintain consistency with existing styling and component usage patterns.
*   Ensure all database access goes through the defined storage layer (`server/storage.ts`).
*   Use the client-server component pattern to prevent "Refs cannot be used in Server Components" errors.
*   Keep RSC benefits for data loading where possible, only opt into Client Components when necessary.

## Database Migrations

The project uses a multi-environment migration strategy with Drizzle Kit. **Do not use `npm run db:push`**. The correct workflow is to generate a migration script and then apply it.

### Environments
The project has three distinct migration directories for different environments:
-   `migrations-local/`: For local development.
-   `migrations-preview/`: For Vercel preview deployments (branches).
-   `migrations-vercel/`: For the Vercel production deployment.

### Workflow
1.  **Generate Migration:** Create a new SQL migration file by running the `generate` command. You must target the correct `drizzle.config.ts` file for the environment you are working on.
    ```bash
    # Example for the 'preview' environment
    DATABASE_URL="<your_preview_database_url>" npx drizzle-kit generate --config drizzle.config.ts
    ```
2.  **Apply Migration:** Run the migration against the database.
    ```bash
    # Example for the 'preview' environment
    DATABASE_URL="<your_preview_database_url>" npx drizzle-kit migrate --config drizzle.config.ts
    ```
This ensures that schema changes are tracked, versioned, and applied consistently across different environments. 