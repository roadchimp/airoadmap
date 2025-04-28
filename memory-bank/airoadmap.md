# AI Roadmap Project Documentation

## Project Structure

```
├── app/                    # Next.js App Router pages, layouts, API routes
├── client/src/            # Legacy client-side code
├── server/                # Backend-specific logic
│   ├── storage.ts         # Storage abstraction layer
│   └── pg-storage.ts      # PostgreSQL implementation
├── shared/                # Code shared between client and server
│   └── schema.ts          # Database schema and types
├── components/            # Reusable UI components
├── lib/                   # General utility functions
├── hooks/                 # Custom React hooks
├── migrations/            # Database migrations
├── docs/                  # Documentation
└── memory-bank/           # Project knowledge base
```

## Environment Information

### Development Environment
- **Node.js Version:** Latest LTS (as specified in package.json)
- **Package Manager:** npm
- **TypeScript:** ^5.6.3
- **ES Modules:** Enabled (`"type": "module"` in package.json)

### Build & Deployment
- **Build Tool:** Vite
- **Deployment Platform:** Vercel
- **Build Commands:**
  - `npm run build` - Full build
  - `npm run dev` - Development server
  - `npm run start` - Production server

### Environment Variables
Required environment variables:
- `NODE_ENV` - Environment mode (development, production, test)
- Database connection variables (typically in .env files)
- API keys and secrets (if applicable)

### Scripts
Key npm scripts:
- `dev` - Start development server
- `build` - Build for production
- `start` - Start production server
- `test` - Run tests
- `db:push` - Push database schema changes
- `db:setup` - Setup environment
- `storage:export` - Export storage data
- `storage:migrate` - Migrate to PostgreSQL
- `scraper:run` - Run job scraper
- `scraper:tools` - Run tool scraper
- `process:batch` - Process batch output

### Vercel Configuration
- **Framework:** Vite
- **Build Command:** `npm run build`
- **API Routes:** `/api/(.*)` -> `dist/index.js`
- **Static Assets:** `/assets/(.*)` -> `/assets/$1`
- **Cron Jobs:**
  - Job scraper: Daily at midnight
  - Job description processing: Daily at 2 AM

## Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'consultant'
);
```

#### Organizations
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  size TEXT NOT NULL,
  description TEXT
);
```

#### Departments
```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);
```

#### Job Roles
```sql
CREATE TABLE job_roles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  department_id INTEGER NOT NULL,
  description TEXT,
  key_responsibilities TEXT[],
  ai_potential TEXT
);
```

#### AI Capabilities
```sql
CREATE TABLE ai_capabilities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  implementation_effort TEXT,
  business_value TEXT,
  ease_score NUMERIC,
  value_score NUMERIC,
  primary_category TEXT,
  license_type TEXT,
  website_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Assessments
```sql
CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  organization_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  step_data JSONB
);
```

#### Reports
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  executive_summary TEXT,
  prioritization_data JSONB,
  ai_suggestions JSONB,
  performance_impact JSONB,
  consultant_commentary TEXT
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
export type WizardStepData = {
  basics?: {
    companyName: string;
    industry: string;
    size: string;
    goals: string;
    stakeholders: string[];
  };
  roles?: {
    selectedDepartments: string[];
    selectedRoles: Array<{
      id?: number;
      title: string;
      department: string;
      description?: string;
      responsibilities?: string[];
    }>;
    prioritizedRoles?: number[];
    customDepartment?: string;
  };
  painPoints?: {
    roleSpecificPainPoints: Record<string, {
      description?: string;
      severity?: number;
      frequency?: number;
      impact?: number;
    }>;
    generalPainPoints?: string;
  };
  // ... additional step data types
};
```

## Migrations

### Current Migrations
1. `0000_needy_tomas.sql` - Initial schema setup
2. `0001_early_johnny_storm.sql` - First schema update
3. `0002_lazy_silver_samurai.sql` - Second schema update

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Next.js API Routes, Express.js (legacy)
- **Database:** PostgreSQL with Drizzle ORM
- **Deployment:** Vercel
