# Active Context

## Current Focus: Client-Server Component Separation and UI Refinement

We've recently refactored several key pages in the application to properly separate server and client components according to Next.js App Router best practices. This primarily addresses the "Refs cannot be used in Server Components" error that was occurring in multiple sections of the application.

### Key Changes

1. **Client-Server Component Pattern**
   - Server Components (page.tsx) now focus on data fetching
   - UI components using refs (from Shadcn UI) moved to Client Components marked with 'use client'
   - This pattern has been implemented in dashboard, reports, and landing pages

2. **Dashboard Improvements**
   - Added card-based UI with metrics
   - Clearly separated data fetching from UI rendering

3. **Reports Management**
   - Implemented data tables with proper client-side components
   - Added capability to view assessment reports

4. **Current Assessments**
   - Added a new assessments overview page
   - Implemented a table UI with sorting, actions (edit, view report, delete)
   - Connected with the dashboard metrics

5. **Landing Page Refinement**
   - Cleaned up landing page UI
   - Fixed component organization for proper client/server separation

### UI Component Architecture

We're now following a consistent pattern across the application:

1. **Server Components (`app/(app)/[feature]/page.tsx`):**
   - Focus exclusively on data fetching
   - Pass data to client components
   - Minimal UI, typically just a container and headings

2. **Client Components (`app/(app)/[feature]/[ComponentName].tsx`):**
   - Marked with 'use client'
   - Handle all UI rendering with refs
   - Implement interactivity
   - Use Shadcn UI components

### Sidebar Navigation

The sidebar navigation has been updated to include:
- Dashboard
- Assessments
  - New Assessment
  - Current Assessments
- Reports
- Libraries
  - Job Roles
  - AI Capabilities
  - AI Tools
- Settings

### Next Steps

1. Review other pages in the application that may have similar component architecture issues
2. Apply this pattern to any new features
3. Consider converting some existing client components in the components directory to use this pattern
4. Improve performance by leveraging RSC capabilities wherever possible

## Report template updates

Report revamp:

1. Enhanced Configuration: Industry (Mature/Immature), Company Stage (Existing but now used), Strategic Focus. (FR1.x)

2. Performance Metrics: A new data entity (performance_metrics table) linked many-to-many with Job Roles. (FR2.x, FR5.1.4, FR5.1.5)

3. Dynamic Metric Relevance: Metric importance/weighting varies based on Company Stage and Strategic Focus. (FR2.4, FR5.1.6)

4. AI Adoption Score™: A new composite score calculated from several components (Adoption Rate, Time Saved, Cost Efficiency, Perf. Improvement, Tool Sprawl). Requires data input and configurable weighting. (FR3.x, FR5.1.x)

5. ROI Calculation: Calculated based on score components. (FR3.2.1.2)

6. New Report Tabs/Sections:

- Overview: Shows AI Adoption Score™, Company Profile (Industry, Stage, Focus). (FR4.1)

- Priority Matrix: Enhanced to show AI Potential based on context. (FR4.2)

- Opportunities: (Likely similar to existing but might show new scores).

- Performance Metrics: New tab listing metrics, relevance based on context. (FR4.4)

- AI Adoption Score™: New tab breaking down the score components and ROI calculation. (FR4.5)

1. Drill-Down View: Ability to see role-specific score details. (FR4.3)

2. Data Model Changes: New tables (performance_metrics, job_role_metrics), updates to potentially assessments or a new table for score inputs. (FR5.1)

3. New APIs: For CRUD on metrics, managing links, storing/retrieving score data. (FR5.2)

4. New UI: For configuration, score input, and the new report sections. (FR5.3)

Analysis of Sample Code Structure (temp/report-improvements-v2):

- The structure suggests a replacement or significant refactor of the existing report page (app/(app)/reports/[id]/page.tsx).

- The new page.tsx (43KB) likely handles the layout with the new tabs and fetching/passing data to the updated/new components (opportunities-table.tsx, priority-matrix.tsx, and potentially components for the new tabs not explicitly listed but implied by the page size).

- The presence of chart.tsx strongly suggests visualizations are used, likely for the AI Adoption Score™ or Performance Metrics tabs.

**Proposed Implementation Plan:**

This plan aims to integrate the new functionality incrementally. We'll need to read the content of the sample .tsx files during implementation to adapt them correctly.

(Phase 1: Data Model & Backend Foundation)

1. Schema Updates (shared/schema.ts):

- Define performance_metrics table (name, unit, description). (FR2.2, FR5.1.4)

- Define job_role_performance_metrics join table (many-to-many between job_roles and performance_metrics). (FR2.3, FR5.1.5)

- Define storage for metric relevance rules/weights based on Stage/Focus (Could be a new table metric_relevance_rules or JSONB field). (FR2.4, FR5.1.6)

- Define storage for AI Adoption Score™ input components. (Could be added as jsonb to assessments table, or a new assessment_score_inputs table linked to assessments). Decide based on expected data volume/query needs. (FR3.1)

- Add industry_maturity (enum 'Mature'/'Immature'), company_stage (enum 'Startup'/'Early Growth'/'Scaling'/'Mature'), strategic_focus (array of text or enum, allow 'Other') fields to the assessments table (or potentially organizations if it makes more sense). (FR1.x, FR5.1.x)

1. Database Migrations: Generate and apply migrations based on schema changes.

2. Storage Layer Updates (server/storage.ts, server/pg-storage.ts):

- Implement CRUD functions for PerformanceMetric.

- Implement functions to manage JobRole <-> PerformanceMetric links.

- Implement functions to manage metric relevance rules.

- Implement functions to save/retrieve AI Adoption Score™ input data.

- Update getAssessment / createAssessment / updateAssessment to handle new fields (Industry, Stage, Focus).

1. API Route Development (app/api/...):

- Create CRUD API endpoints for Performance Metrics (e.g., /api/performance-metrics).

- Create API endpoints to manage metric/role linking.

- Create API endpoint(s) to save AI Adoption Score™ input data (e.g., POST /api/assessments/:id/score-inputs).

- Modify /api/reports/:id (GET) or create a new endpoint to fetch all necessary data for the augmented report (assessment details including Stage/Focus, score inputs, metrics, report results).

(Phase 2: Core Logic & Admin UI)

1. Server-Side Logic (server/lib/...):

- Implement calculateAIAdoptionScore function (takes inputs, applies weights, calculates ROI, normalizes values). Needs access to configurable weights. (FR3.2)

- Modify calculatePrioritization or related report generation logic:

- To potentially factor in the new AI Potential calculation for the heatmap (FR4.2). Logic needed: How Stage/Industry/Focus determine AI Potential.

- To call calculateAIAdoptionScore.

- To fetch relevant performance metrics based on Stage/Focus.

- Store calculated AI Adoption Score™ and ROI details in the reports table (add new jsonb fields?).

1. Admin/Library UI (Optional but Recommended):

- Create UI (likely within components/library/) for Admins to:

- Manage Performance Metrics (CRUD). (FR2.2)

- Link Metrics to Job Roles. (FR2.3)

- Define Metric Relevance rules/weights based on Stage/Focus. (FR2.4, FR5.1.6)

- Configure AI Adoption Score™ component weightings. (FR3.2.1.3)

(Phase 3: Report UI Integration)

1. Update Assessment Wizard (assessment-wizard.tsx):

- Add input fields for selecting Industry (Mature/Immature), Company Stage, and Strategic Focus during assessment setup (likely in the 'Basics' step). (FR1.x)

1. Integrate New Report Page Structure:

- Read temp/report-improvements-v2/app/reports/[id]/page.tsx: Understand its data fetching, layout (tabs), and component usage.

- Replace/Refactor app/(app)/reports/[id]/page.tsx: Update your existing report page component based on the sample's structure. Adapt its data fetching to call the updated/new API endpoint(s) from Phase 1 to get all required data.

1. Integrate/Update Report Components:

- Overview Tab: Modify to display AI Adoption Score™ and Company Profile section using data fetched by the parent page.

- Priority Matrix:

- Read temp/report-improvements-v2/app/reports/[id]/priority-matrix.tsx.

- Update your priority-matrix.tsx component to match the sample and display AI Potential per cell based on new logic/data. (FR4.2)

- Opportunities Tab:

- Read temp/report-improvements-v2/app/reports/[id]/opportunities-table.tsx.

- Update your opportunities-table.tsx and/or components/report/OpportunitiesTab.tsx if the new version includes additional columns (like AI Adoption Score per role) or different visualizations.

- Performance Metrics Tab (New):

- Analyze corresponding component from the sample code (if present) or build a new component.

- Display metrics, showing relevance based on assessment context (Stage/Focus). Use data fetched by the parent page. (FR4.4)

- AI Adoption Score™ Tab (New):

- Analyze corresponding component from the sample code (if present) or build a new component.

- Display the breakdown of score components and ROI calculation. Use charting component (chart.tsx?) from sample if applicable. (FR4.5, FR3.x)

1. Implement Drill-Down (Potentially Deferred):

- This requires more interactive logic (e.g., clicking a role in the matrix/table) to show a modal or separate view with role-specific score components and metrics. Can be added after the main tabs are functional. (FR4.3)

1. Styling and Export:

- Integrate print.css from the sample code (utils/print-styles.ts might also be relevant).

- Ensure Export functions (handleExportPDF, handleExportCSV, etc.) still work and include data from new sections if required. (FR4.6.2)

(Phase 4: Data Input UI & Testing)

1. AI Adoption Score™ Input UI:

- Determine where this data is input. Is it part of the assessment wizard? A separate form linked from the report? A backend integration? Implement the UI accordingly. (FR3.1.1)

1. Testing: Thoroughly test:

- Configuration saving/loading.

- Assessment wizard updates.

- Score component input and saving.

- Report generation with new data and calculations.

- All report tabs and visualizations.

- Filtering/sorting on tables.

- Export functionality.

- Print styles.

