# Tech Context: AI GTM Readiness Analyzer

## Core Technologies
- **Frontend Framework:** Next.js (App Router structure)
- **Backend Framework:** Next.js API Routes (preferred) with legacy Express.js routes
- **Database:** PostgreSQL
- **Programming Languages:** TypeScript
- **Styling:** Tailwind CSS with Shadcn UI (built on Radix UI)

## Development & Operations
- **Version Control:** Git
- **Package Management:** npm
- **Runtime Environment:** Node.js
- **Testing:** Jest (configured in jest.config.js)
- **Deployment:** Vercel (indicated by vercel.json)
- **CI/CD:** Vercel deployments

## Key Dependencies & Tools
- **Frontend State Management:** Zustand or TanStack React Query
- **Database ORM:** Drizzle ORM
- **API Communication:** Next.js API Routes
- **Database Access:** Abstracted via server/storage.ts with PostgreSQL implementation
- **Coding Standards:** This project uses ESM ("type": "module"), all new code should be consistent

## Project Structure
- **`app/`**: Next.js App Router pages, layouts, API routes
- **`client/src/`**: Legacy client-side code
- **`server/`**: Backend-specific logic, storage implementations
- **`shared/`**: Code shared between client and server
- **`components/`**: Reusable UI components
- **`lib/`**: General utility functions
- **`hooks/`**: Custom React hooks

## Technical Constraints & Considerations
- **Next.js App Router First:** Prioritize using Next.js App Router features
- **Minimize Client Components:** Use React Server Components by default
- **API Routes:** Prefer Next.js API Routes over legacy Express routes
- **Database Interaction:** All operations through server/storage.ts abstraction
- **Schema Definition:** Source of truth in shared/schema.ts
- **Type Safety:** Strict TypeScript practices with shared types
- **Path Aliases:** Use defined aliases from tsconfig.json
