# AI Roadmap Generator

A web application designed to help organizations assess their AI readiness and identify opportunities for AI implementation.

## Features

- Interactive assessment wizard to gather detailed information about roles, processes, and tech stack.
- Automated scoring and prioritization of AI opportunities based on value and ease of implementation.
- Library management for Job Roles, AI Capabilities, and AI Tools.
- Role-based access control (potential future feature).
- Data storage using PostgreSQL with Drizzle ORM.
- Modern, responsive UI built with Next.js, React, and Tailwind CSS (shadcn/ui).

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI Library**: React
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui (built on Radix UI)
- **State Management**: TanStack React Query (for server state), potentially Zustand/Context for client state.
- **Backend**: Next.js API Routes (preferred), legacy Express routes (`server/routes.ts`)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Deployment**: Vercel (preferred), Local Development

## Prerequisites

- Node.js (v18 or higher recommended)
- npm package manager
- Git
- PostgreSQL database (local or cloud-based like Neon)
- OpenAI API key (if using AI-powered features)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd airoadmap
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Environment Configuration

Create a `.env` file in the root directory. Copy `.env.example` if it exists, or create one with the following variables:

```env
# --- Database --- 
# Option 1: Local PostgreSQL
# DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Option 2: Neon Serverless PostgreSQL (or other cloud provider)
DATABASE_POSTGRES_URL="YOUR_NEON_OR_CLOUD_CONNECTION_STRING"

# --- OpenAI (Optional) --- 
# Required for features like prioritization analysis
OPENAI_API_KEY="your_openai_api_key"

# --- Server (Optional - Primarily for legacy Express setup if used) ---
# PORT=5000 
# HOST=0.0.0.0

# --- Vercel (Optional - Automatically set when deployed) ---
# VERCEL_ENV="production" # or "preview", "development"
```

**Important:** For local development, ensure you have a running PostgreSQL instance and set `DATABASE_URL` accordingly. For Vercel deployment, set `DATABASE_POSTGRES_URL` in Vercel's environment variables.

## Database Setup

1.  **Configure your `.env` file** with your database connection string (`DATABASE_URL` for local, `DATABASE_POSTGRES_URL` for Vercel/Neon).
2.  **Apply database migrations** using Drizzle Kit:
    ```bash
    # Generate SQL migration files based on schema changes
    # npm run db:generate
    
    # Apply migrations to the database
    npm run db:push 
    # OR for production environment (if using .env.production)
    # npm run db:push:prod 
    ```
    *Note: `db:generate` is typically used when you modify `shared/schema.ts` and want to create a new SQL migration file. `db:push` directly pushes schema changes to the database (useful for development, potentially risky for production without review).* 

3.  **(Optional) Seed initial data:** Scripts might exist in `server/scripts/` for seeding data (e.g., `seedJobRoles.ts`). Check package.json or scripts for commands.

## Running the Application

### Local Development

1.  Ensure your database is running and accessible.
2.  Apply migrations (`npm run db:push`).
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:3000` (or the port specified by Next.js).

### Vercel Deployment

1.  Connect your GitHub repository to a Vercel project.
2.  Configure Environment Variables in Vercel project settings:
    *   `DATABASE_POSTGRES_URL`: Your Neon or other cloud PostgreSQL connection string.
    *   `OPENAI_API_KEY` (if needed).
3.  Vercel will automatically build and deploy upon pushes to the connected branch.

## Project Structure

```
airoadmap/
├── app/                    # Next.js App Router: Pages, Layouts, API Routes
│   ├── api/                # API routes (e.g., /api/assessment/score)
│   │   └── ...
│   ├── (main)/             # Route group for main app pages
│   │   ├── assessment/     # Assessment wizard pages/components
│   │   ├── libraries/      # Library management pages/components
│   │   └── ...             # Other main application sections
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Root page (likely landing page)
├── client/                 # Legacy Client Code (potentially migrate to app/)
│   ├── public/             # Static assets (images, fonts)
│   ├── src/
│   │   ├── components/     # Reusable React components (some might move to app/)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Client-side utilities
│   │   ├── pages/          # Legacy page components (consider migrating)
│   │   └── styles/         # Global styles (if any)
├── components/             # Shared UI components (used by app/ and client/)
│   └── ui/                 # shadcn/ui components
├── server/                 # Backend-specific logic
│   ├── api/                # API Route handlers (used by server/routes.ts)
│   ├── batch-processing/   # Batch job logic
│   ├── lib/                # Server-side libraries (e.g., prioritization)
│   ├── scripts/            # Database scripts (migrations, seeding)
│   ├── routes.ts           # Legacy Express route definitions
│   ├── pg-storage.ts       # PostgreSQL storage implementation
│   └── storage.ts          # Storage interface definition
├── shared/                 # Code shared between frontend and backend
│   ├── schema.ts           # Drizzle ORM schema, Zod schemas, TS types
│   └── scoring.ts          # Scoring logic utilities
├── public/                 # Static assets served from root
├── .env                    # Local environment variables (DO NOT COMMIT)
├── .env.example            # Example environment variables
├── drizzle.config.ts       # Drizzle ORM configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## API Endpoints

This application uses a combination of legacy Express routes and newer Next.js API routes.

### Legacy Express Routes (`server/routes.ts`)

*   **Departments:**
    *   `GET /api/departments`: List all departments.
*   **Job Roles:**
    *   `GET /api/job-roles`: List all job roles (includes `departmentName`).
    *   `GET /api/job-roles/department/:departmentId`: List job roles for a specific department.
    *   `POST /api/job-roles`: Create a new job role.
*   **AI Capabilities:**
    *   `GET /api/ai-capabilities`: List all AI capabilities.
    *   `POST /api/ai-capabilities`: Create a new AI capability.
*   **Assessments:**
    *   `GET /api/assessments`: List all assessments.
    *   `GET /api/assessments/user/:userId`: List assessments for a specific user.
    *   `GET /api/assessments/:id`: Get a specific assessment by ID.
    *   `POST /api/assessments`: Create a new assessment.
    *   `PATCH /api/assessments/:id/step`: Update wizard step data for an assessment.
    *   `PATCH /api/assessments/:id/status`: Update the status of an assessment.
*   **Reports:**
    *   `GET /api/reports`: List all reports.
    *   `GET /api/reports/:id`: Get a specific report by ID.
    *   `GET /api/reports/assessment/:assessmentId`: Get the report for a specific assessment.
    *   `POST /api/reports`: Create a new report.
    *   `PATCH /api/reports/:id/commentary`: Update the consultant commentary for a report.
*   **Prioritization:**
    *   `POST /api/prioritize`: Trigger prioritization calculation for an assessment and create a report.
*   **AI Tools (`server/api/tools.ts`):**
    *   `GET /api/tools`: List AI tools (supports `search`, `category`, `licenseType` query params). Returns `AiTool[]`.
    *   `GET /api/tools/:id`: Get a specific AI tool by ID. Returns `AiTool`.
    *   `POST /api/tools`: Create a new AI tool. Expects `InsertAiTool` body. Returns `AiTool`.
    *   `PUT /api/tools/:id`: Update an existing AI tool. Expects `Partial<InsertAiTool>` body. Returns `AiTool`.
    *   `DELETE /api/tools/:id`: Delete an AI tool. Returns 204 No Content.
*   **Batch Processing:**
    *   `POST /api/batch/export`: Export job descriptions ready for batch processing.
    *   `POST /api/batch/results`: Process results from a completed batch job.
*   **WebSocket:**
    *   `/ws`: WebSocket endpoint for real-time communication (details TBD).

### Next.js API Routes (`app/api/`)

*   **Assessment Scoring (`/api/assessment/score`):**
    *   `POST`: Calculate and save (upsert) scores for an assessment step. Expects JSON body with scoring criteria and `wizardStepId`. Returns saved `AssessmentScoreData`.
    *   `GET`: Retrieve saved scores for an assessment step. Requires `wizardStepId` query parameter. Returns `AssessmentScoreData`.

## Development Guidelines

### Frontend Development

*   Prioritize Next.js App Router features (Server Components, API Routes in `app/api/`) for new development.
*   Minimize Client Components (`'use client'`). Use React Server Components (RSC) by default.
*   Use TanStack React Query for managing server state and data fetching.
*   Leverage shadcn/ui components for UI consistency.
*   Follow responsive design principles (mobile-first recommended).
*   Use TypeScript for type safety, referencing types from `shared/schema.ts` where applicable.

### Backend Development

*   Prefer Next.js API Routes (`app/api/.../route.ts`) over legacy Express routes.
*   All database interactions should go through the storage layer (`server/storage.ts`, `server/pg-storage.ts`).
*   Use Drizzle ORM for database queries and schema management (`shared/schema.ts`).
*   Adhere to strict TypeScript practices.
*   Use ES Modules (`import`/`export`).

### Code Style

*   Follow standard TypeScript best practices.
*   Use functional components with Hooks in React.
*   Write clear, concise, and maintainable code.
*   Add JSDoc comments for complex functions, components, and types.
*   Ensure code is formatted according to project standards (likely Prettier/ESLint).
*   Use path aliases defined in `tsconfig.json` for cleaner imports.

## Contributing

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 