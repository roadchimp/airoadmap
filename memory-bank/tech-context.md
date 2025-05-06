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