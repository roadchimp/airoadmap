# AI Roadmap Project Documentation

## Project Structure

```
├── app/                    # Next.js App Router: Pages, Layouts, Components, API Routes
│   └── api/                # Next.js API Route handlers
├── client/src/             # Legacy client-side code (React/Vite) - Less used now
├── components/             # Reusable UI components
│   ├── library/            # Library Management UI (DataTable, Dialogs, Layout)
│   └── shared/             # Components shared across different features (e.g., ConfirmationDialog)
├── server/                 # Backend-specific logic (non-request handling)
│   ├── storage.ts          # Storage abstraction layer interface
│   ├── pg-storage.ts       # PostgreSQL storage implementation
│   ├── lib/                # Server-side libraries (e.g., prioritizationEngine)
│   └── scripts/            # Server-side utility scripts (migrations, scraping etc.)
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

## Recent Changes / Milestones

*   **Library UI Refactor (July 2024):**
    *   Refactored `components/library/DataTable.tsx` into a generic component using `@tanstack/react-table`, removing conditional logic and improving type safety.
    *   Updated `components/library/LibraryLayout.tsx` to define columns (`ColumnDef`) for Job Roles, AI Capabilities, and AI Tools, passing them to the appropriate `DataTable` instances or using `useReactTable` directly.
    *   Corrected usage of `AiTool` primary key (`tool_id` instead of `id`) throughout the library components.
    *   Created a reusable `components/shared/ConfirmationDialog.tsx`.
    *   Resolved various type errors related to `tsconfig.json` configuration and component prop mismatches.

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
  organization_id INTEGER NOT NULL, -- REFERENCES organizations(id)
  user_id INTEGER NOT NULL, -- REFERENCES users(id)
  status TEXT NOT NULL DEFAULT 'draft', -- e.g., draft, completed
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
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

#### Assessment Results (`assessment_results`)
*(Stores the processed output/analysis of a completed assessment)*
```sql
CREATE TABLE assessment_results (
  result_id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
  identified_themes JSONB,
  ranked_priorities JSONB,
  recommended_capabilities JSONB,
  capability_rationale JSONB,
  existing_tool_analysis TEXT,
  recommended_tools JSONB,
  rollout_commentary TEXT,
  heatmap_data JSONB,
  processing_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Processing, Success, Failed
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
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

*(Migrations managed by Drizzle Kit in the `migrations/` folder)*

### Current Migrations
1. `0000_needy_tomas.sql` - Initial schema setup
2. `0001_early_johnny_storm.sql` - First schema update
3. `0002_lazy_silver_samurai.sql` - Second schema update

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Next.js API Routes (`app/api/`), Node.js
- **Database:** PostgreSQL with Drizzle ORM
- **Deployment:** Vercel
