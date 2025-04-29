# System Patterns

This document outlines the key architectural patterns, technical decisions, and design principles used in the AI Roadmap project.

## Architecture Overview

The project follows a modern full-stack web application architecture centered around Next.js.

-   **Frontend:** Built with Next.js App Router, React, and TypeScript. Utilizes Server Components (RSC) by default, opting into Client Components (`'use client'`) only when necessary for interactivity or browser APIs.
-   **Backend:** Primarily uses Next.js API Routes (`app/api/.../route.ts`) running on Node.js. Legacy Express routes previously in `server/routes.ts` have been removed.
-   **Database:** PostgreSQL accessed via the Drizzle ORM.
-   **Storage Layer:** A dedicated abstraction (`server/storage.ts`) exists, with a PostgreSQL implementation (`server/pg-storage.ts`), ensuring all database interactions go through this layer.
-   **Shared Code:** Logic and types shared between frontend and backend are located in the `shared/` directory, with schema definitions in `shared/schema.ts`.

## Key Technical Decisions & Principles

-   **Next.js App Router First:** New features and APIs should leverage the App Router structure (`app/`) over legacy patterns (`client/src/`, `server/routes.ts`).
-   **Minimize Client Components:** Default to RSCs for performance and leverage Next.js server-side capabilities.
-   **Centralized Schema:** `shared/schema.ts` is the single source of truth for database and data structure definitions using Drizzle schema syntax.
-   **Abstracted Data Access:** All direct database operations are handled through the `server/storage.ts` interface and its implementation (`server/pg-storage.ts`), promoting decoupling and maintainability.
-   **Type Safety:** Strict TypeScript usage is enforced throughout the codebase, leveraging types generated from the schema.
-   **ES Modules:** The project uses ES Modules (`"type": "module"` in `package.json`).

## Component & Directory Structure

-   **`app/`**: Primary location for new development (pages, layouts, components, API routes). Components are often colocated with features.
-   **`client/src/`**: Contains legacy React code. Modifications should be limited; prefer migrating or creating anew in `app/`.
-   **`server/`**: Holds backend logic *not* directly related to request handling (e.g., storage implementation, database utilities, batch processing).
-   **`shared/`**: For code shared across client and server (types, schemas, utilities).
-   **`components/`**: Contains potentially reusable UI components, though colocation within `app/` is preferred for new components.
-   **`lib/`**: General utility functions.
-   **`hooks/`**: Custom React hooks, mostly for the legacy `client/src/` application.

## Critical Implementation Paths

-   **API Development:** New API endpoints are created as Next.js API Routes within `app/api/`. They should utilize the storage layer for data access.
-   **Database Changes:** Schema modifications are defined in `shared/schema.ts`, and migrations are generated using Drizzle Kit (`npm run db:push` or similar migration generation commands) and stored in `migrations/`.
-   **UI Development:** New UI features are built within the `app/` directory using React Server Components where possible, styled with Tailwind CSS, and potentially using Shadcn UI components.

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