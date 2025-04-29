# Tech Context

This document details the technologies, tools, and development environment used in the AI Roadmap project.

## Core Technologies

*   **Runtime:** Node.js (Latest LTS recommended)
*   **Language:** TypeScript (Strict mode enabled)
*   **Framework:** Next.js (using App Router)
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **Component Library:** Shadcn UI (built on Radix UI)
*   **State Management:** Likely Zustand or TanStack React Query (Confirm if one is primary - review codebase or `.cursorrules` if updated)
*   **Database:** PostgreSQL
*   **ORM:** Drizzle ORM

## Development Environment

*   **Package Manager:** npm
*   **Module System:** ES Modules (`"type": "module"` in `package.json`)
*   **Code Formatting/Linting:** Likely Prettier & ESLint (Confirm configuration)
*   **Path Aliases:** Configured in `tsconfig.json` for cleaner imports (e.g., `@/app/*`, `@shared/*`, `@/server/*`).
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
*   **`shadcn-ui` / `radix-ui`:** UI components
*   **`drizzle-orm` / `drizzle-kit`:** Database ORM and migration tool
*   **`pg`:** PostgreSQL driver for Node.js
*   **`zod`:** Schema validation (likely used, confirm usage)

## Technical Constraints & Considerations

*   Adherence to Next.js App Router conventions is preferred for new development.
*   Leverage Vercel platform features for deployment, cron jobs, etc.
*   Maintain consistency with existing styling and component usage patterns.
*   Ensure all database access goes through the defined storage layer (`server/storage.ts`). 