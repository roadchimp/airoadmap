# AI Roadmap Project Documentation

## Project Structure

```
├── app/                    # Next.js App Router: Pages, Layouts, Components, API Routes
│   ├── (app)/              # Protected application routes requiring auth
│   │   ├── dashboard/      # Dashboard with stats and overview
│   │   ├── assessment/     # Assessment features
│   │   │   ├── current/    # List of user's current assessments
│   │   │   ├── new/        # New assessment creation
│   │   │   └── [id]/       # Individual assessment views
│   │   ├── reports/        # Assessment reports
│   │   │   └── [id]/       # Individual report views
│   │   └── library/        # Library management
│   ├── api/                # Next.js API Route handlers
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

## Project Status (as of Jan 2025)

### What Works
- **Core Features:**
  - Dashboard overview
  - Assessment creation and management
  - Asynchronous, non-blocking report generation
  - Professional PDF exports for executive reports
  - User-specific data access for assessments and reports
  - Library management (Job Roles, AI Capabilities, AI Tools)
  - Batch processing system for job descriptions and capabilities
- **Technical Implementation:**
  - Stable Next.js App Router structure with clear Server/Client component separation.
  - Robust backend with a PostgreSQL database via Drizzle ORM and a storage abstraction layer.
  - Accurate AI Adoption Score calculation engine with industry-specific defaults.
  - Secure API with authentication and CSRF protection middleware.

### What Needs Improvement
- **User Communication:**
  - Proactively notify users about major bug fixes (like the AI Adoption Score correction) and feature enhancements.
  - Improve clarity of error messages and user feedback during long-running processes.
- **UI/UX:**
  - Enhance mobile responsiveness across the application.
  - Optimize performance for reports with very large datasets.
- **Technical Debt:**
  - Continue to refactor legacy patterns and strengthen error handling.

### Next Development Priorities
1. **Short-term:**
   - Performance optimizations for report generation and large data tables.
   - Mobile responsiveness enhancements.
   - Add more data visualizations to reports.
2. **Medium-term:**
   - Implement advanced analytics and score tracking over time.
   - Enhance the recommendation engine based on assessment data.

## Viewing Reports

Report-Related Routes
*   Page Routes:
  *   /reports - Main reports listing page (app/(app)/reports/page.tsx)
  *   /reports/[id] - Individual report view (app/(app)/reports/[id]/page.tsx)
*   API Routes:
  *   /api/reports - Main reports API endpoint:
    *   GET - Lists all reports or filters by assessmentId
    *   POST - Creates a new report
  *   /api/reports/[id] - Likely handles operations on a specific report
  *   /api/public/reports - Public fallback endpoint that also lists reports
*   Key Components:
  *   ReportsTable.tsx - Client component that displays reports in the UI

Data Flow
The reports data flow follows this pattern:
  *   The server component `app/(app)/reports/page.tsx` fetches reports and assessments for the current authenticated user by calling `storage.listReportsForUser()` and `storage.listAssessmentsForUser()`.
  *   It then passes this data as props to the client component `ReportsTable.tsx`, which is responsible for rendering the UI.
  *   The `storage.createReport()` method in `pg-storage.ts` has been updated to automatically fetch the `user_id` from the associated assessment, ensuring all new reports are correctly linked to a user.
  *   The `api/public/*` endpoints are no longer used for the reports page.

*** Generating Report using OpenAI API Calls ***

When you click "Generate Report" on the final assessment step, the system:
Creates an assessment record (/api/assessments)
Generates a report based on that assessment (/api/reports/assessment/${id})
The report generation process involves multiple AI calls:
generateEnhancedExecutiveSummary - Uses OpenAI to create a summary
generateAICapabilityRecommendations - For each role in the assessment (This is being used in the Opportunities tab and generates specific AI capability recommendations for each of the top roles identified in the assessment.)
generatePerformanceImpact - For each role and department (Used in the "Performance Metrics" tab. These predictions provide numerical metrics for expected improvements and ROI. From the screenshot, you can see "$490000 Estimated Annual ROI" in the right panel)

Caching Considerations
All routes include cache control headers and use unstable_noStore() to disable caching:

unstable_noStore();
// and
headers: {
  'Cache-Control': 'no-store, max-age=0, must-revalidate'
}

## Recent Changes / Milestones

*   **AI Service Vercel Deployment Fix (January 2025):**
    *   **Problem:** AI services were incorrectly identifying serverless function execution as "build time" in Vercel environments, causing OpenAI calls to be skipped and report regeneration to fail.
    *   **Root Cause:** The `isVercelBuild` detection logic `process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'production' && !process.env.NEXT_RUNTIME` was too broad, treating preview/production runtime as build time.
    *   **Solution:** 
        *   Changed build detection to `process.env.VERCEL && process.env.NEXT_PHASE === 'phase-production-build'` which only considers it build time during actual Next.js static generation.
        *   Added comprehensive logging for build detection variables to aid debugging.
    *   **Impact:** Fixed report regeneration, AI capability recommendations, and performance impact generation in deployed environments.
    *   **Testing Infrastructure:** Created `/api/test-ai` endpoint and `/dev/test-ai` page to test AI services in deployed environments since `/scripts` folder is in .gitignore.
    *   **Files Modified:** `server/lib/services/aiService.ts`, `app/api/test-ai/route.ts` (new), `app/dev/test-ai/page.tsx` (new).

*   **Executive PDF Export System (January 2025):**
    *   **Feature:** Implemented a professional, multi-page PDF export for executive reports, optimized for C-level presentations.
    *   **Implementation:**
        *   Created a dedicated PDF layout component (`ExecutivePdfLayout.tsx`) and print-optimized CSS (`executive-pdf.css`).
        *   The system generates a 5-6 page report including a title page, executive summary, AI adoption score, priority matrix, recommendations, and tool appendix.
        *   Integrated using the browser's native `window.print()` functionality for seamless PDF generation.
        *   Resolved complex CSS page-break and content-splitting issues to ensure a clean, professional layout.
    *   **Files Modified:** `components/report/ExecutivePdfLayout.tsx`, `components/report/executive-pdf.css`, `app/(app)/reports/[id]/view/page.tsx`.

*   **Asynchronous Report Generation (January 2025):**
    *   **Problem:** Assessment submissions were timing out due to long-running synchronous OpenAI API calls for report generation (5-10 minutes).
    *   **Solution:**
        *   Refactored the submission process into an asynchronous "fire-and-forget" pattern. The API now responds instantly, and report generation happens in the background.
        *   Created a new `/api/assessments/[id]/report-status` endpoint for the frontend to poll for completion.
        *   Implemented a polling mechanism on the frontend with clear UI states (loading spinners, progress messages) to inform the user.
    *   **Impact:** Eliminated timeout errors, improved perceived performance, and provided a better user experience for a long-running task.
    *   **Files Modified:** `/api/assessment/submit/route.ts`, `app/(app)/assessment/new/_components/assessment-wizard.tsx`.

*   **API Security Hardening & Auth UX (December 2024):**
    *   **Feature:** Implemented a robust API security and authentication system.
    *   **Implementation:**
        *   Created a middleware system (`withAuth`, `withCsrf`) to protect API routes against unauthorized access and CSRF attacks.
        *   Automated user profile creation and mapping between Supabase Auth and internal user profiles.
        *   Integrated a transparent CSRF token handling mechanism into the client-side API utility.
        *   Improved authentication-related UX, such as login redirects and clear sign-in prompts.
    *   **Impact:** All sensitive API endpoints are now protected, providing enterprise-grade security.
    *   **Files Modified:** `app/api/middleware.ts`, `utils/api-client.ts`, multiple API routes.

*   **Critical Production Bug Fixes (December 2024):**
    *   **Issue 1: State not being saved during wizard navigation**
        *   **Problem:** The assessment wizard only saved data to local state and localStorage, never persisting to backend during step navigation
        *   **Impact:** Users lost progress when navigating away, refreshing, or switching between steps
        *   **Root Cause:** `saveCurrentStep` function only updated local state, `updateAssessmentStepMutation` was defined but never used
        *   **Solution:** Modified `saveCurrentStep` to actually persist data to backend using `updateAssessmentStepMutation` for existing assessments and create new assessments when completing basics step
        *   **Files Modified:** `app/(app)/assessment/new/_components/assessment-wizard.tsx`
    
    *   **Issue 2: Company name not being passed to organization**
        *   **Problem:** Company name from basics step wasn't being properly passed to organization creation
        *   **Impact:** Organizations were created without proper company names in production
        *   **Root Cause:** Organization creation logic was only executed in development mode with test_auth_bypass
        *   **Solution:** Modified assessment submission to always create/update organization with company name regardless of environment
        *   **Files Modified:** `app/(app)/assessment/new/_components/assessment-wizard.tsx`
    
    *   **Issue 3: strategicFocus field causing ZodError in API**
        *   **Problem:** `strategicFocus` field was being included in the updateAssessmentStep payload but wasn't defined in the schema
        *   **Impact:** Step updates were failing with "Unrecognized key(s) in object: 'strategicFocus'" error
        *   **Solution:** Modified the API endpoint to accept strategicFocus as a top-level field and updated the storage layer to handle it
        *   **Files Modified:** 
            *   `app/api/assessments/[id]/step/route.ts` - Created extended schema that includes strategicFocus
            *   `server/storage.ts` - Updated interface to accept strategicFocus parameter
            *   `server/pg-storage.ts` - Updated implementation to handle strategicFocus parameter
            *   `app/(app)/assessment/new/_components/assessment-wizard.tsx` - Updated mutation to include strategicFocus in payload
    
    *   **Production Environment Fixes:**
        *   Removed `test_auth_bypass=true` parameter from production API calls
        *   Added proper error handling for assessment and organization creation
        *   Enhanced logging for debugging production issues
        *   Improved user feedback with more specific toast messages

*   **Critical AI Adoption Score Bug Fix (December 2024):**
    *   Identified and resolved critical scaling bug in `server/lib/aiAdoptionScoreEngine.ts`
    *   **Problem:** AI Adoption Scores were showing dramatically lower values (e.g., 17) when component scores were high (80%, 70%, 100%, 100%)
    *   **Root Cause:** Incorrect scaling factor - was using `rawScore * 20` assuming weights sum to ~5, but weights actually sum to ~1.0
    *   **Solution:** Changed scaling to `rawScore * 100` for proper 0-100 percentage conversion
    *   **Validation:** Added debug testing that confirms calculations now work correctly (example: 72.3 score for high component values)
    *   **User Impact:** Users need to regenerate existing reports to see corrected AI Adoption Scores
    *   **Files Modified:** `server/lib/aiAdoptionScoreEngine.ts` (lines ~346-347)

*   **User-Specific Data Access (January 2025):**
    *   **Feature:** Enhanced data privacy by ensuring users can only see assessments and reports they have created.
    *   **Implementation:**
        *   Added a `user_id` to the `reports` table to link reports directly to users.
        *   Created new user-specific data access methods (`listReportsForUser`, `listAssessmentsForUser`) in the storage layer.
        *   Refactored data fetching in server components (`/reports/page.tsx`, `/assessment/current/page.tsx`) to use the new methods, restricting data to the authenticated user.
    *   **Impact:** Enforces data isolation and security between users and aligns with Next.js best practices by moving data fetching to the server.
    *   **Files Modified:** `shared/schema.ts`, `server/storage.ts`, `server/pg-storage.ts`, `app/(app)/reports/page.tsx`, `app/(app)/assessment/current/page.tsx`.

*   **Comprehensive Report System Improvements (November 2024):**
    *   Implemented 8 major UI improvements including header consolidation and role-based filtering
    *   Added email sharing functionality via new API endpoint `/api/reports/[id]/share/route.ts`
    *   Fixed React hooks ordering errors that were causing application crashes
    *   Enhanced role filtering to use assessment's `selectedRoles` instead of capability extraction
    *   Added "AI Tool Recommendations" subtab with intelligent filtering
    *   Fixed ranking calculations to be dynamic instead of using stored rank values
    *   Renamed "Assessment Context Card" to "Company Information" with improved styling
    *   Resolved issues with role data extraction from `stepData.roles.selectedRoles` path

*   **Role Data Format Fix & React Error Resolution (July 2025):**
    *   **Problem:** Assessment views were crashing with React error #31 due to objects being passed as React children. Additionally, role lookup was failing during report generation, causing "Could not find role data" warnings and undefined role names.
    *   **Solution:**
        *   **React Error Fix:** Enhanced `InfoItem` and `InfoList` components with proper type safety and object handling. Added robust `renderArray` helper function to safely render arrays vs objects. Fixed stakeholder and role rendering to handle both string and object formats.
        *   **Role Data Format Mismatch:** Identified critical data flow issue where assessment submission converts full role objects to IDs (line 103 in submit route), but prioritization engine expected full objects. Updated prioritization engine to fetch role data from database when needed instead of expecting pre-populated objects.
        *   **TypeScript Fixes:** Added proper type casting (`as unknown as number[]`) to handle schema vs runtime format differences. Updated all dependent files to handle role IDs correctly.
    *   **Impact:** Fixed client-side crashes during assessment viewing. Resolved role identification issues during report generation. Console logs now show meaningful role titles instead of "undefined (ID: undefined)". All role processing now works correctly with proper database lookups.
    *   **Files Modified:** `app/(app)/assessment/[id]/view/_components/assessment-view-client.tsx`, `server/lib/engines/prioritizationEngine.ts`, `server/pg-storage.ts`, `app/api/reports/[id]/populate-filters/route.ts`, `lib/prioritizationEngine.ts`.

*   **Report Generation Refactor & Deterministic AI (July 2025):**
    *   **Problem:** Regenerating reports resulted in identical content due to an application-level cache. Additionally, internal API calls between serverless functions were failing with `ECONNRESET` errors in the Vercel environment.
    *   **Solution:**
        *   Refactored the core report generation logic into a central, reusable function in `server/lib/services/reportService.ts`.
        *   Modified the `/api/assessment/submit` and `/api/assessment/[id]/regenerate` routes to call this new service directly, eliminating the unreliable internal `fetch` calls.
        *   Added a `noCache: true` option to the report generation flow, allowing the "Re-generate Report" feature to bypass the application's internal cache and request a fresh response from OpenAI.
        *   Ensured deterministic AI outputs for the same assessment by adding the `assessmentId` as the `seed` parameter in the OpenAI API call.
    *   **Impact:** Fixed the `ECONNRESET` error, improved architectural robustness, and provided precise control over caching and AI output determinism.
    *   **Files Modified:** `server/lib/services/reportService.ts` (new), `app/api/prioritize/route.ts`, `app/api/assessment/submit/route.ts`, `app/api/assessment/[id]/regenerate/route.ts`, `server/lib/engines/prioritizationEngine.ts`, `server/lib/services/aiService.ts`.

*   **Batch Processing System Enhancement:**
    *   Extended `batchProcessor.ts` with job role matching capabilities for AI capabilities
    *   Added new storage methods: `mapCapabilityToJobRole()`, `unmapCapabilityFromJobRole()`, `getJobRolesForCapability()`
    *   Created single-use migration script `populate-existing-capabilities.ts` for existing data
    *   Fixed database column naming inconsistencies (capability_id vs capabilityId)
    *   Added comprehensive documentation in `README-job-role-matching.md`
    *   Enhanced CLI with new commands: `export-job-roles`, `process-job-roles`

*   **UI Client-Server Refactoring (August 2024):**
    *   Refactored key pages to properly separate Server Components from Client Components
    *   Fixed "Refs cannot be used in Server Components" errors across the application
    *   Implemented a consistent pattern for data fetching and UI rendering
    *   Created client components (`ReportsTable.tsx`, `DashboardContent.tsx`, `LandingPageContent.tsx`)
    *   Enhanced dashboard UI with metrics and card-based layout
    *   Added Current Assessments page with management capabilities
    
*   **Library UI Refactor (July 2024):**
    *   Refactored `components/library/DataTable.tsx` into a generic component using `@tanstack/react-table`, removing conditional logic and improving type safety.
    *   Updated `components/library/LibraryLayout.tsx` to define columns (`ColumnDef`) for Job Roles, AI Capabilities, and AI Tools, passing them to the appropriate `DataTable` instances or using `useReactTable` directly.
    *   Corrected usage of `AiTool` primary key (`tool_id` instead of `id`) throughout the library components.
    *   Created a reusable `components/shared/ConfirmationDialog.tsx`.
    *   Resolved various type errors related to `tsconfig.json` configuration and component prop mismatches.
    *   Added a "Scraped Jobs" tab to the library page to display job descriptions from the database.

## UI Architecture Pattern

The application now follows a consistent UI architecture pattern to properly separate server and client components:

1. **Server Components (`app/(app)/[feature]/page.tsx`):**
   - Focus on data fetching using `async`/`await`
   - Minimal UI structure
   - Pass data to client components

2. **Client Components (`app/(app)/[feature]/ComponentName.tsx`):**
   - Marked with `'use client'` directive
   - Handle UI rendering with Shadcn UI components
   - Implement interactive features

Key implementations of this pattern:
- **Dashboard:** `app/(app)/dashboard/page.tsx` + `DashboardContent.tsx`
- **Reports:** `app/(app)/reports/page.tsx` + `ReportsTable.tsx`
- **Landing Page:** `app/page.tsx` + `LandingPageContent.tsx`
- **Current Assessments:** `app/(app)/assessment/current/page.tsx` + `CurrentAssessmentsTable.tsx`

## Environment Information

### Development Environment
- **Node.js Version:** Latest LTS (as specified in package.json)
- **Package Manager:** npm
- **TypeScript:** ^5.6.3
- **ES Modules:** Enabled (`"type": "module"` in package.json)

### Build & Deployment
- **Build Tool:** Next.js (`next build`)
- **Deployment Platform:** Vercel
- **Build Commands:**
  - `npm run build` -> `next build`
  - `npm run dev` -> `next dev`
  - `npm run start` -> `next start`

### Environment Variables
Required environment variables:
- `NODE_ENV` - Environment mode (development, production, test)
- Database connection variables (typically in .env files)
- API keys and secrets (if applicable)

### Scripts
Key npm scripts:
- `dev`: Start Next.js development server
- `build`: Build Next.js application for production
- `start`: Start Next.js production server
- `test`: Run tests
- `db:push` - Push database schema changes
- `db:setup` - Setup environment
- `storage:export` - Export storage data
- `storage:migrate` - Migrate to PostgreSQL
- `scraper:run` - Run job scraper
- `scraper:tools` - Run tool scraper
- `process:batch` - Process batch output

### Vercel Configuration
- **Framework Preset:** Next.js (Auto-detected)
- **Build Command:** `npm run build` (which runs `next build`)
- **Output Directory:** `.next` (Auto-detected)
- **API Routes:** Handled automatically by Next.js preset based on `app/api/`.
- **Static Assets:** Handled automatically by Next.js preset.
- **Cron Jobs:**
  - Job scraper: Daily at midnight
  - Job description processing: Daily at 2 AM

## Database Schema

*(Schema defined using Drizzle ORM in `shared/schema.ts`)*

### Core Assessment Tables

#### Users (`users`)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Hashed password
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'consultant' -- e.g., consultant, admin
);
```

#### Organizations (`organizations`)
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  size TEXT NOT NULL, -- e.g., Small, Medium, Large
  description TEXT
);
```

#### Departments (`departments`)
```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);
```

#### Job Roles (`job_roles`)
```sql
CREATE TABLE job_roles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  department_id INTEGER NOT NULL, -- REFERENCES departments(id)
  description TEXT,
  key_responsibilities TEXT[],
  ai_potential TEXT -- e.g., High, Medium, Low
);
```

#### AI Capabilities (`ai_capabilities`)
```sql
CREATE TABLE ai_capabilities (
  id INTEGER PRIMARY KEY, -- Uses integer PK based on migration script
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  implementation_effort TEXT, -- Qualitative: High, Medium, Low
  business_value TEXT, -- Qualitative: High, Medium, Low, Very High
  ease_score NUMERIC, -- Quantitative score (e.g., 1-5)
  value_score NUMERIC, -- Quantitative score (e.g., 1-5)
  primary_category TEXT, -- Migrated field from ai_tools
  license_type TEXT, -- Migrated field from ai_tools
  website_url TEXT, -- Migrated field from ai_tools
  tags TEXT[], -- Migrated field from ai_tools
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Assessments (`assessments`)
```sql
CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id INTEGER NOT NULL REFERENCES user_profiles(id),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  step_data JSONB -- Stores wizard step data
);
```

#### Assessment Responses (`assessment_responses`)
*(Stores individual answers from the assessment wizard)*
```sql
CREATE TABLE assessment_responses (
  response_id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_identifier TEXT NOT NULL, -- e.g., "painPoints.roleX.severity"
  response_text TEXT,
  response_numeric NUMERIC,
  response_boolean BOOLEAN,
  response_json JSONB, -- For multi-select, complex data
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Assessment Scores (`assessment_scores`)
*(Stores calculated scores per assessment step/role)*
```sql
CREATE TABLE assessment_scores (
  id SERIAL PRIMARY KEY,
  wizard_step_id TEXT NOT NULL UNIQUE,
  time_savings NUMERIC NOT NULL,
  quality_impact NUMERIC NOT NULL,
  strategic_alignment NUMERIC NOT NULL,
  data_readiness NUMERIC NOT NULL,
  technical_feasibility NUMERIC NOT NULL,
  adoption_risk NUMERIC NOT NULL,
  value_potential_total NUMERIC NOT NULL,
  ease_of_implementation_total NUMERIC NOT NULL,
  total_score NUMERIC NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Reports (`reports`)
*(Stores the generated reports for assessments)*
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id),
  user_id INTEGER NOT NULL REFERENCES user_profiles(id), -- Added to link report to a user
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executive_summary TEXT,
  prioritization_data JSONB, -- Stores heatmap and prioritized items
  ai_suggestions JSONB, -- Stores AI solution recommendations
  performance_impact JSONB, -- Stores role impacts and ROI
  consultant_commentary TEXT -- Optional commentary from consultant
);
```

### Library / External Data Tables

#### AI Tools (`ai_tools`)
```sql
CREATE TABLE ai_tools (
  tool_id INTEGER PRIMARY KEY, -- Uses integer PK based on migration script
  tool_name TEXT NOT NULL,
  primary_category TEXT,
  license_type TEXT,
  description TEXT,
  website_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tool_name) -- Added via index idx_ai_tools_tool_name
);
```

#### Capability Tool Mapping (`capability_tool_mapping`)
*(Many-to-many relationship between AI Capabilities and AI Tools)*
```sql
CREATE TABLE capability_tool_mapping (
  capability_id INTEGER NOT NULL REFERENCES ai_capabilities(id) ON DELETE CASCADE,
  tool_id INTEGER NOT NULL REFERENCES ai_tools(tool_id) ON DELETE CASCADE,
  PRIMARY KEY (capability_id, tool_id)
);
```

#### Job Descriptions (`job_descriptions`)
*(Stores scraped job posting data)*
```sql
CREATE TABLE job_descriptions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  job_board TEXT NOT NULL,
  source_url TEXT NOT NULL,
  raw_content TEXT NOT NULL,
  processed_content JSONB,
  keywords TEXT[],
  date_scraped TIMESTAMP NOT NULL DEFAULT NOW(),
  date_processed TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'raw', -- raw, processed, error
  error TEXT
);
```

#### Job Scraper Configs (`job_scraper_configs`)
*(Configuration for the job scraping process)*
```sql
CREATE TABLE job_scraper_configs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  target_website TEXT NOT NULL,
  keywords TEXT[],
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  cron_schedule TEXT NOT NULL DEFAULT '0 0 * * *', -- Daily at midnight
  last_run TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Key Types

#### Scoring Criteria
```typescript
export const scoringCriteria = {
  valuePotential: {
    timeSavings: "time_savings",
    qualityImpact: "quality_impact",
    strategicAlignment: "strategic_alignment"
  },
  easeOfImplementation: {
    dataReadiness: "data_readiness",
    technicalFeasibility: "technical_feasibility",
    adoptionRisk: "adoption_risk"
  }
};
```

#### Assessment Data Types
```typescript
// Defined by Zod schema `wizardStepDataSchema` in shared/schema.ts
export type WizardStepData = z.infer<typeof wizardStepDataSchema>;

// Example subset:
{
  basics: {
    companyName: string;
    industry: string;
    // ...etc
  };
  roles: {
    selectedRoles: Array<{
      id?: number;
      title: string;
      department: string;
      // ...etc
    }>;
  };
  // ... other steps ...
}
```

## Migrations
Note: Do not auto-generate .sql files for any database modifications, as Drizzle requires the drizzle-kit generate and then migrate sequence with a _journal.json file to track sequence of migration scripts

*(Migrations managed by Drizzle Kit in the `migrations/` folder)*

### Current Migrations
1. `0000_needy_tomas.sql` - Initial schema setup
2. `0001_early_johnny_storm.sql` - First schema update
3. `0002_lazy_silver_samurai.sql` - Second schema update
4. `0003_client_server_updates.sql` - Updates for client-server pattern

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Next.js API Routes (`app/api/`), Node.js
- **Database:** PostgreSQL with Drizzle ORM
- **Deployment:** Vercel
- **State Management:** TanStack Query for data fetching, Zustand for client state
- **Data Visualization:** React-based charting libraries (heatmaps, etc.)

## Recent Updates

- **Local Caching**: The assessment wizard now uses local caching for step data, committing to the database only on final submission.

## Database Schema Restructuring (September 2024)

### AI Capabilities Database Restructuring

The database has been restructured to separate global AI capabilities from assessment-specific capabilities:

1. **Global AI Capabilities (`ai_capabilities` table)**
   - Stores global definitions of AI capabilities regardless of assessment
   - Added new columns with `default_` prefix:
     - `default_implementation_effort`
     - `default_business_value`
     - `default_ease_score`
     - `default_value_score`
     - `default_feasibility_score`
     - `default_impact_score`
   - Has a unique index on `name` and `category`

2. **Assessment-Specific Capabilities (`assessment_ai_capabilities` table)**
   - New join table linking assessments to global capabilities
   - Stores assessment-specific scores, priorities, and context:
     - `assessment_id` - reference to assessment
     - `ai_capability_id` - reference to global capability
     - `value_score`, `feasibility_score`, `impact_score`, `ease_score`
     - `priority`, `rank`, `implementation_effort`, `business_value`
     - `assessment_notes` - contextual notes for this specific assessment

3. **Additional Context (`assessment_capability_context` table)**
   - Provides additional context for capabilities within a specific assessment
   - Similar structure to `assessment_ai_capabilities` but with different fields

### UI Updates for Reports

The Reports UI has been updated to accommodate the new database schema:

1. **CapabilitiesTable Component**
   - Updated to reference `defaultValueScore`, `defaultFeasibilityScore`, etc. instead of direct properties
   - Fixed display of capability scores and priorities with fallbacks to default values

2. **CapabilityDetailModal Component**
   - Removed references to no-longer-existing properties like `implementationFactors`, `quickImplementation`, etc.
   - Implemented default values for visualization

3. **CSV Export Functionality**
   - Updated to use the proper fields from the restructured database schema
   - Added fallbacks to maintain backward compatibility

4. **Type Compatibility**
   - Fixed TypeScript errors related to the changed `FullAICapability` structure
   - Ensured all components properly reference the new schema

The priority enum was also renamed from `capability_priority` to `capability_priority_enum` for better naming consistency.

## Session Management Module (Assessment Wizard)

**Status:** `Completed`

A global session management module has been implemented for the assessment wizard, providing a robust, centralized, and maintainable state management solution.

### Core Architecture

- **React Context (`SessionProvider`):** Located at `lib/session/SessionContext.tsx`, this provider wraps the entire assessment wizard. It initializes the session, manages state and cache, and provides the `useSession` hook for child components to access session data and actions.
- **`useReducer` for State Management:** All session state transitions are handled by the `sessionReducer` in `lib/session/sessionReducer.ts`. This ensures predictable state updates and centralizes business logic.
- **Middleware Layer:**
    - **Auto-Save (`AutoSaveMiddleware.ts`):** A debounced and interval-based middleware automatically persists the session to browser storage, providing status updates via the UI.
    - **Validation (`SessionValMiddleware.ts`):** A middleware that provides synchronous validation for step data and navigation logic.
- **Dual-Storage Strategy (`SessionStorageManager.ts`):**
    - **`sessionStorage`:** Used for transient wizard state that should be cleared when the browser tab is closed.
    - **`localStorage`:** Used for persistent data like department/role selections and the department/role cache, featuring automatic cache expiration and a stale-while-revalidate strategy.

### API and Database Enhancements

- **Consolidated API Endpoint (`/api/roles-departments`):** Replaces the previous `/api/departments` and `/api/job-roles` endpoints. It fetches all necessary data in a single, efficient query.
- **Materialized View (`mv_department_role_summary`):** The database now includes a materialized view that pre-aggregates department and role data. This view is queried by the new API endpoint, significantly improving performance.
- **Database Schema:** The `departments` and `job_roles` tables have been updated with `is_active` flags and other columns to support the new features. All schema changes are managed via Drizzle migrations.

### Frontend Component Refactoring

- **Smart Container / Dumb Components:** The `AssessmentWizard` component is now a "smart" container that manages all logic, while the individual step components (`BasicInfoStep`, `DepartmentSelectionStep`, etc.) are "dumb" components that simply display data and dispatch actions to the session context.
- **Client-Side Filtering:** The department and role selection steps now feature high-performance, client-side filtering and search, eliminating network requests during user interaction.

This new architecture resolves previous issues with state synchronization, complex `useEffect` dependencies, and manual local storage management, resulting in a more performant, reliable, and developer-friendly assessment wizard.
