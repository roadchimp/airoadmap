# AI Roadmap Generator

A web application designed to help organizations assess their AI readiness and identify opportunities for AI implementation.

## Features

- Interactive assessment wizard to gather detailed information about roles, processes, and tech stack.
- Automated scoring and prioritization of AI opportunities based on value and ease of implementation.
- Dashboard with assessment metrics and progress tracking.
- Report generation with AI-powered recommendations.
- Current assessments management (view, edit, delete).
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
- **State Management**: TanStack React Query (for data fetching), Zustand (for client state)
- **Data Tables**: TanStack Table
- **Backend**: Next.js API Routes (`app/api/`)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation

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
│   ├── (app)/              # Protected application routes requiring auth
│   │   ├── dashboard/      # Dashboard with stats and overview
│   │   ├── assessment/     # Assessment features
│   │   │   ├── current/    # List of user's current assessments
│   │   │   ├── new/        # New assessment creation
│   │   │   └── [id]/       # Individual assessment views
│   │   ├── reports/        # Assessment reports
│   │   │   └── [id]/       # Individual report views
│   │   └── library/        # Library management
│   ├── api/                # API routes for data access
│   │   ├── assessment/     # Assessment-related API endpoints
│   │   ├── reports/        # Report-related API endpoints
│   │   └── library/        # Library management API endpoints
│   └── LandingPageContent.tsx  # Client component for landing page
├── client/src/             # Legacy client-side code (React/Vite) - Less used now
├── components/             # Reusable UI components
│   ├── ui/                 # Shadcn UI components
│   ├── assessment/         # Assessment-related components
│   ├── report/             # Report-related components 
│   ├── library/            # Library Management UI (DataTable, Dialogs, Layout)
│   └── shared/             # Components shared across different features
├── server/                 # Backend-specific logic (non-request handling)
│   ├── storage.ts          # Storage abstraction layer interface
│   ├── pg-storage.ts       # PostgreSQL storage implementation
│   ├── lib/                # Server-side libraries (e.g., prioritizationEngine)
│   ├── scripts/            # Server-side utility scripts (migrations, scraping etc.)
│   └── batch-processing/   # Batch processing logic
├── shared/                 # Code shared between client and server
│   └── schema.ts           # Database schema (Drizzle) and shared types
├── lib/                    # General utility functions (client-side focus)
├── hooks/                  # Custom React hooks (client-side focus)
├── migrations/             # Database migrations (Drizzle Kit)
├── public/                 # Static assets served by Next.js
├── docs/                   # Project documentation
└── memory-bank/            # AI Assistant project knowledge base
```

## Client-Server Component Architecture

The application follows a consistent pattern for implementing UI features:

1. **Server Components (`app/(app)/[feature]/page.tsx`):**
   - Focus exclusively on data fetching using `async`/`await`
   - Minimal UI, typically just a container and headings
   - Pass fetched data to client components as props
   - No usage of refs, hooks, useState, or other client-only React features

2. **Client Components (`app/(app)/[feature]/ComponentName.tsx`):**
   - Marked with `'use client'` directive at the top
   - Handle all UI rendering with Shadcn UI components (which use refs)
   - Implement interactivity with hooks and state
   - Typically colocated in the same directory as the server component
   - Example: `ReportsTable.tsx`, `DashboardContent.tsx`, `LandingPageContent.tsx`

This pattern prevents the "Refs cannot be used in Server Components" error while maintaining the performance benefits of Server Components for data fetching.

## API Endpoints

The application uses Next.js API Routes for all backend functionality.

### Next.js API Routes (`app/api/`)

*   **Assessments:**
    *   `GET /api/assessment`: List all assessments.
    *   `GET /api/assessment/[id]`: Get a specific assessment by ID.
    *   `POST /api/assessment`: Create a new assessment.
    *   `PATCH /api/assessment/[id]`: Update an assessment.
    *   `DELETE /api/assessment/[id]`: Delete an assessment.

*   **Assessment Scoring:**
    *   `POST /api/assessment/score`: Calculate and save scores for an assessment step.
    *   `GET /api/assessment/score`: Retrieve saved scores for an assessment step.

*   **Reports:**
    *   `GET /api/reports`: List all reports.
    *   `GET /api/reports/[id]`: Get a specific report by ID.
    *   `GET /api/reports/assessment/[assessmentId]`: Get the report for a specific assessment.
    *   `POST /api/reports`: Create a new report.
    *   `PATCH /api/reports/[id]`: Update a report.

*   **Library Management:**
    *   `GET /api/library/jobs`: List all job roles.
    *   `GET /api/library/capabilities`: List all AI capabilities.
    *   `GET /api/library/tools`: List all AI tools.
    *   `POST/PATCH/DELETE` endpoints for each library entity.

## Development Guidelines

### Frontend Development

*   **Client-Server Component Pattern:**
    *   Use Server Components (`page.tsx`) for data fetching
    *   Use Client Components (marked with `'use client'`) for UI rendering with interactivity
    *   Colocate components in the same directory when they form a logical unit
*   Use React Server Components (RSC) by default, only opt into Client Components when necessary
*   Use TanStack React Query for data fetching and server state management
*   Use Zustand for client-side state management when needed
*   Leverage shadcn/ui components for UI consistency
*   Follow responsive design principles (mobile-first recommended)
*   Use TypeScript for type safety, referencing types from `shared/schema.ts` where applicable

### Backend Development

*   Use Next.js API Routes (`app/api/.../route.ts`) for all API endpoints
*   All database interactions should go through the storage layer (`server/storage.ts`, `server/pg-storage.ts`)
*   Use Drizzle ORM for database queries and schema management (`shared/schema.ts`)
*   Adhere to strict TypeScript practices
*   Use ES Modules (`import`/`export`)

### Code Style

*   Follow standard TypeScript best practices
*   Use functional components with Hooks in React
*   Write clear, concise, and maintainable code
*   Add JSDoc comments for complex functions, components, and types
*   Ensure code is formatted according to project standards (Prettier/ESLint)
*   Use path aliases defined in `tsconfig.json` for cleaner imports:
    *   `@/app/*` -> `./app/*`
    *   `@shared/*` -> `./shared/*`
    *   `@/server/*` -> `./server/*`
    *   `@/components/*` -> `./components/*`
    *   `@/lib/*` -> `./lib/*`

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

## Batch Processing System

The application includes a robust batch processing system for managing AI capabilities and job roles. This system is located in `server/batch-processing/` and handles:

1. Job description scraping and analysis
2. AI capability extraction and management
3. AI tool mapping and recommendations
4. Capability rationalization and deduplication

### Job Description Processing

```bash
# 1. Scrape new job descriptions
npx tsx server/batch-processing/batchProcessor.ts scrape-jobs

# 2. Export jobs for processing (only new ones)
npx tsx server/batch-processing/batchProcessor.ts export-jobs
# Or process all jobs including previously processed ones
npx tsx server/batch-processing/batchProcessor.ts export-jobs --force

# 3. Process OpenAI results
npx tsx server/batch-processing/batchProcessor.ts process-jobs <response_file_path>
```

### AI Capability Management

```bash
# 1. Export capabilities for tool mapping (only new ones)
npx tsx server/batch-processing/batchProcessor.ts export-capabilities
# Or process all capabilities including previously processed ones
npx tsx server/batch-processing/batchProcessor.ts export-capabilities --force

# 2. Process OpenAI results and map tools
npx tsx server/batch-processing/batchProcessor.ts process-tools <response_file_path>
```

### Additional Commands

```bash
# List all batch files
npx tsx server/batch-processing/batchProcessor.ts list

# Reset job processing tracking
npx tsx server/batch-processing/batchProcessor.ts reset-tracking

# Update capabilities cache
npx tsx server/batch-processing/batchProcessor.ts update-cache
```

### Batch Processing Directory Structure

```
server/batch-processing/
├── batchProcessor.ts          # Main batch processing script
├── logs/                      # Log files and tracking data
│   ├── capabilities.json      # Cache of AI capabilities
│   ├── processed_jobs.json    # Tracks processed job IDs
│   └── processed_capabilities.json # Tracks processed capability IDs
├── requests/                  # JSONL files for batch processing
│   └── [timestamp]_manifest.json  # Manifest files
└── responses/                 # OpenAI API response files
```

### Weekly Processing Workflow

For weekly maintenance and updates:

1. Run `scrape-jobs` to collect new job descriptions
2. Run `export-jobs` to prepare new jobs for processing
3. Submit to OpenAI and download results
4. Run `process-jobs` with the response file
5. Run `export-capabilities` to prepare new AI capabilities
6. Submit to OpenAI and download results
7. Run `process-tools` with the response file

The system automatically tracks processed items to ensure incremental processing, only handling new entries unless forced to reprocess all. 