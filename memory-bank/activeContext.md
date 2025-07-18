# Active Context

## Current Focus: Executive PDF Export System Implementation (January 2025)

### Recently Completed: Professional PDF Export Functionality

**Feature:** Implemented a sophisticated PDF export system for executive-quality reports that can be presented to CEOs, CFOs, and Board members.

**Implementation Details:**
1. **Executive PDF Layout Component (`components/report/ExecutivePdfLayout.tsx`):**
   - Professional 5-page report layout optimized for C-level presentations
   - Executive Summary, AI Adoption Score, Priority Matrix, Capabilities Table, Tool Recommendations
   - Completely separate from existing web interface to avoid layout disruption

2. **Professional Styling (`components/report/executive-pdf.css`):**
   - Print-optimized CSS with proper page breaks and professional typography
   - Uses CSS media queries to hide interactive UI and show PDF layout only when printing
   - Executive-quality visual design with consistent branding elements

3. **Seamless Integration:**
   - Updated `ReportView.tsx` to include the PDF layout component (hidden by default)
   - Modified export dropdown to use "Export to PDF" with `window.print()` for native browser PDF generation
   - No changes to existing web interface - all current functionality preserved

4. **Future Customization Framework:**
   - `pdf-branding-system.ts` - Flexible theming system for client-specific branding
   - `pdf-test-utils.ts` - Testing and validation utilities
   - Comprehensive documentation in `README-pdf-export.md`

**Technical Resolution:**
- Fixed TypeScript compilation errors by ensuring proper number conversion in capability sorting
- Corrected property access to use `report.assessment?.title` instead of non-existent `organizationName`
- Successfully builds with no compilation errors

**Recent Updates (Latest):**
- **Fixed Font Sizing Issues**: Reduced KPI metric font sizes from 28pt to 16pt for smaller metrics and 24pt for main AI score
- **Added Page Borders**: Implemented professional top/bottom borders on each page to prevent cut-off appearance
- **Condensed AI Adoption Score Section**: Compressed spacing and layout to fit analysis on single page
- **Added Priority Matrix**: Implemented visual 2x2 matrix showing capability quadrants (Quick Wins, Strategic Investments, etc.)
- **Removed Blank Pages**: Consolidated roadmap and eliminated extra page breaks
- **Improved Page Structure**: Reduced from 5 pages to 4 optimized pages with better content density

**Latest Critical Fixes (Current Session):**
- **Fixed AI Adoption Score Data Issue**: Resolved 0% metrics display
  - Corrected data access pattern for `aiAdoptionScoreDetails.components`
  - Added support for complex object structures (`normalizedScore`, `value`, `score` properties)
  - Now properly displays adoption rates, time savings, cost efficiency, and performance metrics
- **Enhanced Page Layout and Borders**:
  - Increased page padding to 25mm top, 30mm bottom for proper header/footer spacing
  - Added consistent gradient borders (top: orange, bottom: gray) on all pages
  - Prevented executive summary from breaking awkwardly across pages with `page-break-inside: avoid`
- **Fixed Priority Matrix Issues**:
  - Increased spacing from page top (30pt) to prevent edge cutoff
  - Enhanced quadrant padding (16pt) and added minimum height (60pt)
  - Created prominent circular "balloon" count indicators with white background and orange borders
  - Fixed text overlay issues with proper z-index positioning
  - Matrix now stays intact as one unit with `page-break-inside: avoid`

**Latest Structural Improvements (Current Session):**
- **Professional Title Page**: Created dedicated title page with centered layout
  - Large report title with organization name prominently displayed
  - Assessment title as subtitle
  - Generation date in footer
  - Professional typography with proper spacing
- **Dedicated Executive Summary Page**: Full page for executive summary
  - Prevents awkward page breaks and text cutoff
  - Enhanced readability with proper line spacing
  - Professional background styling with orange accent border
- **Optimized Page 3 Layout**: Condensed key metrics, organization profile, and AI adoption score
  - Compact grid layout for AI score components
  - Reduced font sizes and spacing for better fit
  - Maintained readability while maximizing content density
- **Enhanced Section Headers**: Updated Priority Matrix header to match AI Adoption Score style
  - Consistent large font size with red underline
  - Added descriptive subtitles for better context
  - Professional formatting throughout

**Structural PDF Layout Fixes (Latest):**
- **Robust Page Break System**: Implemented comprehensive page break controls
  - Added both legacy (`page-break-after: always`) and modern (`break-after: page`) CSS properties
  - Ensured every `.pdf-page` container forces a new physical page
  - Added `break-inside: avoid` to prevent content from splitting across pages
- **Section Integrity Protection**: Applied break-inside controls to all major sections
  - Executive Summary, Key Metrics, Company Profile, AI Adoption Score, Priority Matrix, and Appendix
  - Section titles protected with `break-inside: avoid` to stay with their content
  - Tables and matrices kept together as single units
- **Typography Improvements**: Enhanced text flow with orphans/widows control
  - Added `orphans: 3` and `widows: 3` to prevent single lines from being isolated
  - Improved readability and professional appearance
- **Corrected Page Numbering**: Fixed duplicate page numbering in comments
  - Page 1: Title Page
  - Page 2: Executive Summary  
  - Page 3: Key Metrics + Organization Profile + AI Adoption Score
  - Page 4: Priority Matrix + Strategic Recommendations
  - Page 5: Appendix (Tools + Commentary)
- **Header/Border Consistency**: Ensured proper top/bottom borders on all pages
  - Orange gradient top border on every page
  - Gray gradient bottom border on every page
  - No mid-page horizontal lines or border artifacts

**Updated Page Structure (Latest):**
1. **Page 1**: Title Page - Professional cover with report title, organization name, and assessment title
2. **Page 2**: Executive Summary - Full page dedicated to executive summary with proper spacing
3. **Page 3**: Key Performance Indicators + Organization Profile + AI Adoption Score Analysis (compact)
4. **Page 4**: AI Capability Prioritization Matrix + Strategic Recommendations
5. **Page 5**: Implementation Roadmap + Recommended AI Tools + Consultant Commentary

**User Experience:**
- Single "Export to PDF" button generates professional, print-ready reports
- Browser's native print-to-PDF functionality provides consistent cross-platform results
- 4-page optimized report with improved readability and executive focus
- Professional borders and spacing prevent cut-off issues
- Priority matrix provides at-a-glance strategic overview

## Previous Focus: Asynchronous Report Generation and Timeout Prevention (January 2025)

### Critical Issue Resolution: Assessment Submission Timeouts

**Problem Identified:**
- Assessment submission was failing with JSON parsing errors: "Unexpected token 'A', "An error o"... is not valid JSON"
- Root cause: Synchronous report generation in `/api/assessment/submit` calling `/api/prioritize` with 7 concurrent OpenAI API calls
- Total timeout: 5-10 minutes for AI processing (executive summary + 3 capability recommendations + 3 performance impact calculations)
- Additional issue: Missing `/api/departments` endpoint causing 404 errors

**Solution Implemented:**
1. **Asynchronous Report Generation:**
   - Modified `/api/assessment/submit` to trigger report generation asynchronously (fire-and-forget pattern)
   - Assessment submission now returns immediately with `reportGenerating: true` flag
   - Created new `/api/assessments/[id]/report-status` endpoint for polling report status

2. **API Endpoint Fixes:**
   - Created `/api/departments/route.ts` as backward-compatible wrapper for `/api/roles-departments`
   - Fixed 404 errors in client-side department fetching

3. **Enhanced Frontend UX:**
   - Added automatic status polling every 30 seconds for up to 15 minutes
   - Real-time UI updates when report generation completes
   - Loading states with animated spinners and progress messaging
   - Graceful fallback if report generation takes longer than expected

**Technical Implementation:**
```typescript
// Asynchronous report generation pattern
const triggerReportGeneration = async () => {
  // Fire and forget - don't await
  const reportResponse = await fetch('/api/prioritize', { ... });
};
triggerReportGeneration(); // No await here

// Polling pattern for status updates
const pollForReportStatus = async (assessmentId: number) => {
  const poll = async () => {
    const response = await fetch(`/api/assessments/${assessmentId}/report-status`);
    const status = await response.json();
    if (status.status === 'completed') {
      // Update UI with completed report
    } else {
      setTimeout(poll, 30000); // Poll every 30 seconds
    }
  };
  setTimeout(poll, 5000); // Start after 5 seconds
};
```

**User Experience Improvements:**
- Immediate feedback: "Assessment submitted successfully. Report generation started in background."
- Automatic status checking with visual progress indicators
- Clear messaging about expected completion time (5-10 minutes)
- Smooth transition from "generating" to "completed" state
- Graceful error handling for long-running processes

**Impact:**
- Eliminates timeout errors during assessment submission
- Maintains all existing functionality without schema changes
- Improves perceived performance and user confidence
- Provides better error handling and user communication

## Completed: User-Specific Report and Assessment Viewing (January 2025)

**Feature:** Users can now only see the assessments and reports that they have created. This enhances data privacy and provides a more focused user experience.

**Implementation Details:**
*   **Database:** A `user_id` column was added to the `reports` table to create a direct link between a report and its author.
*   **Backend:**
    *   The `createReport` method was updated to automatically populate the `user_id` from the parent assessment.
    *   New data access methods, `listReportsForUser` and `listAssessmentsForUser`, were created in the storage layer.
*   **Frontend:**
    *   The main pages for reports (`app/(app)/reports/page.tsx`) and current assessments (`app/(app)/assessment/current/page.tsx`) were refactored to perform all data fetching on the server.
    *   These pages now use the new user-specific methods to retrieve data for the authenticated user only.
    *   Client components like `ReportsTable.tsx` were simplified to only handle UI rendering, receiving their data as props.

**Impact:**
*   **Security & Privacy:** Enforces that users can only access their own data.
*   **Code Quality:** Aligns with the project's architecture pattern of fetching data in Server Components and passing it to Client Components, which resolved several client-side errors.

## Previous Focus: API Security Hardening and Authentication UX (December 2024)

### Recent Security Architecture Overhaul

**Major Security Improvements Implemented:**

1. **Robust API Middleware System (`app/api/middleware.ts`):**
   - `withAuth()` - Validates Supabase sessions and maps users to internal profiles
   - `withCsrf()` - Protects against CSRF attacks on state-changing operations
   - `withAuthAndSecurity()` - Combined middleware for full protection
   - All protected API routes now use this security layer

2. **Automatic User Profile Management:**
   - Seamless mapping between Supabase UUID auth IDs and internal integer user IDs
   - Auto-creation of user profiles on first login (no manual registration required)
   - Consistent user identity across authentication and database layers
   - Graceful handling of authentication failures and edge cases

3. **CSRF Protection Integration:**
   - Client-side API client (`utils/api-client.ts`) automatically injects CSRF tokens
   - Server-side validation on all POST/PATCH/DELETE operations
   - Token refresh synchronized with authentication state changes
   - Seamless UX with no user interaction required

4. **Assessment Wizard Authentication Issues Resolved:**
   - Fixed "User not found in request context" errors in assessment creation
   - Proper user ID mapping for assessment ownership
   - Automated organization creation for new users
   - Report generation now works correctly with authenticated users

### Authentication UX Improvements

**User Experience Enhancements:**

1. **Dashboard Access Improvements:**
   - Clear sign-in prompt with prominent button when not authenticated
   - Sign-in button positioned at top of page (not center) for better UX
   - Redirect to login page with proper return URL handling

2. **Header Navigation Updates:**
   - User dropdown shows "Sign in" when not authenticated (instead of "Sign out")
   - Proper authentication state detection in header component
   - Consistent authentication messaging across all protected pages

3. **Assessment Workflow Security:**
   - All assessment creation/modification operations now properly authenticated
   - User ownership validation for assessments and reports
   - Seamless integration between wizard steps and backend security

### Technical Implementation Details

**API Route Protection Pattern:**
```typescript
// All protected routes now follow this pattern:
export const POST = withAuthAndSecurity(async (request: Request, context: any) => {
  const user = context.user; // Mapped internal user profile
  // Route logic with authenticated user context
});
```

**Client-Side Integration:**
- `useAuth` hook provides CSRF tokens automatically
- `apiClient` handles token injection transparently
- Authentication state synchronized across components
- Automatic redirects for unauthenticated access attempts

**Database Security:**
- User profiles automatically linked via `auth_id` field
- Assessment ownership properly validated
- Report access restricted to authorized users
- Graceful handling of orphaned or invalid user states

### Impact and Benefits

1. **Security Hardening:** All API endpoints now properly protected against common web vulnerabilities
2. **Seamless UX:** Users don't experience authentication friction during normal workflows
3. **Robust Error Handling:** Graceful degradation and clear messaging for authentication issues
4. **Developer Experience:** Consistent patterns for implementing new protected API routes
5. **Production Ready:** Enterprise-grade security suitable for production deployment

### Next Steps

1. **Security Audit:** Review all existing API routes to ensure middleware is applied
2. **Performance Testing:** Validate authentication overhead is acceptable
3. **Documentation:** Update API documentation with security requirements
4. **Monitoring:** Implement logging for authentication failures and security events

## Current Focus: AI Adoption Score Calculation Bug Fix and Report System Refinements

### Recent Critical Bug Fix: AI Adoption Score Calculation Engine (December 2024)

**Issue Identified:** The AI Adoption Score was displaying significantly lower values than expected due to a critical scaling bug in the calculation engine.

**Problem Details:**
- Users reported seeing very low scores (e.g., 17) when component scores were high (80%, 70%, 100%, 100%)
- The issue was in `server/lib/aiAdoptionScoreEngine.ts` - the scaling factor was incorrect
- Previous calculation: `rawScore * 20` (assuming weights sum to ~5)
- Actual weights sum to ~1.0, requiring: `rawScore * 100` for proper percentage scaling

**Fix Implemented:**
- Updated the scaling calculation from `rawScore * 20` to `rawScore * 100` 
- The weighted scores already produce a 0-1 range, so multiplying by 100 gives proper percentage
- Added debug testing that confirms the fix works correctly
- Example test results: Components (80%, 70%, 100%, 100%) now produce overall score of 72.3 instead of 17

**Impact:** Users will need to regenerate their reports to see the corrected AI Adoption Scores that properly reflect their component inputs.

### Recent UI and System Improvements

#### Report System Enhancements (November 2024)
1. **8 Major UI Improvements Implemented:**
   - Enhanced header with Export/Share dropdowns replacing cluttered buttons
   - Added email sharing functionality via `/api/reports/[id]/share/route.ts`
   - Moved Assessment Context above consultant commentary
   - Repositioned filters below matrix header for better UX
   - Implemented role-based filtering with clickable badges
   - Added "AI Tool Recommendations" subtab with intelligent filtering
   - Fixed ranking calculations to be dynamic instead of stored values
   - Renamed "Assessment Context Card" to "Company Information" with improved styling

2. **React Hooks Error Resolution:**
   - Fixed "Rendered fewer hooks than expected" error by moving all useState/useEffect to component top
   - Replaced conditional rendering of role filters to prevent hooks ordering issues
   - Improved component architecture to be more stable

3. **Role-Based Filtering System:**
   - Uses assessment's selectedRoles instead of extracting from capabilities
   - Fixed data extraction logic to use `stepData.roles.selectedRoles` path
   - Enhanced storage layer to properly populate selectedRoles from assessment data

#### Batch Processing System Enhancement
1. **Job Role Matching Integration:**
   - Enhanced `batchProcessor.ts` with capability-to-job-role matching functions
   - Added new storage methods: `mapCapabilityToJobRole()`, `unmapCapabilityFromJobRole()`, `getJobRolesForCapability()`
   - Created single-use script `populate-existing-capabilities.ts` for existing data
   - Fixed column naming issues (capability_id vs capabilityId consistency)
   - Added comprehensive documentation in `README-job-role-matching.md`

### Current Technical Architecture

#### Client-Server Component Separation
We've established a mature pattern for Next.js App Router implementation:

1. **Server Components (`app/(app)/[feature]/page.tsx`):**
   - Focus exclusively on data fetching via storage layer
   - Pass data to client components
   - Minimal UI, typically just container and headings

2. **Client Components (`app/(app)/[feature]/[ComponentName].tsx`):**
   - Marked with 'use client'
   - Handle all UI rendering with refs and interactivity
   - Use Shadcn UI components
   - Implement state management and user interactions

#### Report System Data Flow
- Reports use `ReportWithMetricsAndRules` interface with proper selectedRoles population
- Storage abstraction layer handles all database operations via `server/storage.ts`
- PostgreSQL implementation in `server/pg-storage.ts` with Drizzle ORM
- Schema definitions maintained in `shared/schema.ts` as single source of truth

### Next Priorities

1. **User Communication:**
   - Notify users about the AI Adoption Score fix
   - Encourage regeneration of existing reports to see corrected scores

2. **Additional Score Engine Improvements:**
   - Consider adding more detailed component explanations
   - Validate industry-specific defaults are accurate
   - Add score change tracking over time

3. **Continued UI Refinements:**
   - Mobile responsiveness improvements
   - Performance optimizations for large datasets
   - Enhanced accessibility features

### Key System Insights

**AI Adoption Score Engine:**
- Uses industry-specific defaults and company stage weightings
- Supports custom organizational weightings via storage layer
- Includes ROI calculations with realistic assumptions
- Proper scaling is critical for user trust and accuracy

**Report Architecture:**
- Modular tab-based design with shared state management
- Intelligent filtering cascades through all components
- Print-friendly styling with dedicated CSS classes
- Export functionality supports both PDF and CSV formats

**Data Consistency:**
- All database interactions go through storage abstraction
- Schema changes require coordinated updates across storage interface and implementation
- Component props are strictly typed using shared schema definitions

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

1. Enhanced Configuration: Industry (Mature/Immature), Company Stage (Existing but now used), Strategic Focus. (FR1.x)

2. Performance Metrics: A new data entity (performance_metrics table) linked many-to-many with Job Roles. (FR2.x, FR5.1.4, FR5.1.5)

3. Dynamic Metric Relevance: Metric importance/weighting varies based on Company Stage and Strategic Focus. (FR2.4, FR5.1.6)

4. AI Adoption Score™: A new composite score calculated from several components (Adoption Rate, Time Saved, Cost Efficiency, Perf. Improvement, Tool Sprawl). Requires data input and configurable weighting. (FR3.x, FR5.1.x)

5. ROI Calculation: Calculated based on score components. (FR3.2.1.2)

6. New Report Tabs/Sections:

- Overview: Shows AI Adoption Score™, Company Profile (Industry, Stage, Focus). (FR4.1)

- Priority Matrix: Enhanced to show AI Potential based on context. (FR4.2)

- Opportunities: (Likely similar to existing but might show new scores).

- Performance Metrics: New tab listing metrics, relevance based on context. (FR4.4)

- AI Adoption Score™: New tab breaking down the score components and ROI calculation. (FR4.5)

1. Drill-Down View: Ability to see role-specific score details. (FR4.3)

2. Data Model Changes: New tables (performance_metrics, job_role_metrics), updates to potentially assessments or a new table for score inputs. (FR5.1)

3. New APIs: For CRUD on metrics, managing links, storing/retrieving score data. (FR5.2)

4. New UI: For configuration, score input, and the new report sections. (FR5.3)

Analysis of Sample Code Structure (temp/report-improvements-v2):

- The structure suggests a replacement or significant refactor of the existing report page (app/(app)/reports/[id]/page.tsx).

- The new page.tsx (43KB) likely handles the layout with the new tabs and fetching/passing data to the updated/new components (opportunities-table.tsx, priority-matrix.tsx, and potentially components for the new tabs not explicitly listed but implied by the page size).

- The presence of chart.tsx strongly suggests visualizations are used, likely for the AI Adoption Score™ or Performance Metrics tabs.

**Proposed Implementation Plan:**

This plan aims to integrate the new functionality incrementally. We'll need to read the content of the sample .tsx files during implementation to adapt them correctly.

(Phase 1: Data Model & Backend Foundation)

1. Schema Updates (shared/schema.ts):

- Define performance_metrics table (name, unit, description). (FR2.2, FR5.1.4)

- Define job_role_performance_metrics join table (many-to-many between job_roles and performance_metrics). (FR2.3, FR5.1.5)

- Define storage for metric relevance rules/weights based on Stage/Focus (Could be a new table metric_relevance_rules or JSONB field). (FR2.4, FR5.1.6)

- Define storage for AI Adoption Score™ input components. (Could be added as jsonb to assessments table, or a new assessment_score_inputs table linked to assessments). Decide based on expected data volume/query needs. (FR3.1)

- Add industry_maturity (enum 'Mature'/'Immature'), company_stage (enum 'Startup'/'Early Growth'/'Scaling'/'Mature'), strategic_focus (array of text or enum, allow 'Other') fields to the assessments table (or potentially organizations if it makes more sense). (FR1.x, FR5.1.x)

1. Database Migrations: Generate and apply migrations based on schema changes.

2. Storage Layer Updates (server/storage.ts, server/pg-storage.ts):

- Implement CRUD functions for PerformanceMetric.

- Implement functions to manage JobRole <-> PerformanceMetric links.

- Implement functions to manage metric relevance rules.

- Implement functions to save/retrieve AI Adoption Score™ input data.

- Update getAssessment / createAssessment / updateAssessment to handle new fields (Industry, Stage, Focus).

1. API Route Development (app/api/...):

- Create CRUD API endpoints for Performance Metrics (e.g., /api/performance-metrics).

- Create API endpoints to manage metric/role linking.

- Create API endpoint(s) to save AI Adoption Score™ input data (e.g., POST /api/assessments/:id/score-inputs).

- Modify /api/reports/:id (GET) or create a new endpoint to fetch all necessary data for the augmented report (assessment details including Stage/Focus, score inputs, metrics, report results).

(Phase 2: Core Logic & Admin UI)

1. Server-Side Logic (server/lib/...):

- Implement calculateAIAdoptionScore function (takes inputs, applies weights, calculates ROI, normalizes values). Needs access to configurable weights. (FR3.2)

- Modify calculatePrioritization or related report generation logic:

- To potentially factor in the new AI Potential calculation for the heatmap (FR4.2). Logic needed: How Stage/Industry/Focus determine AI Potential.

- To call calculateAIAdoptionScore.

- To fetch relevant performance metrics based on Stage/Focus.

- Store calculated AI Adoption Score™ and ROI details in the reports table (add new jsonb fields?).

1. Admin/Library UI (Optional but Recommended):

- Create UI (likely within components/library/) for Admins to:

- Manage Performance Metrics (CRUD). (FR2.2)

- Link Metrics to Job Roles. (FR2.3)

- Define Metric Relevance rules/weights based on Stage/Focus. (FR2.4, FR5.1.6)

- Configure AI Adoption Score™ component weightings. (FR3.2.1.3)

(Phase 3: Report UI Integration)

1. Update Assessment Wizard (assessment-wizard.tsx):

- Add input fields for selecting Industry (Mature/Immature), Company Stage, and Strategic Focus during assessment setup (likely in the 'Basics' step). (FR1.x)

1. Integrate New Report Page Structure:

- Read temp/report-improvements-v2/app/reports/[id]/page.tsx: Understand its data fetching, layout (tabs), and component usage.

- Replace/Refactor app/(app)/reports/[id]/page.tsx: Update your existing report page component based on the sample's structure. Adapt its data fetching to call the updated/new API endpoint(s) from Phase 1 to get all required data.

1. Integrate/Update Report Components:

- Overview Tab: Modify to display AI Adoption Score™ and Company Profile section using data fetched by the parent page.

- Priority Matrix:

- Read temp/report-improvements-v2/app/reports/[id]/priority-matrix.tsx.

- Update your priority-matrix.tsx component to match the sample and display AI Potential per cell based on new logic/data. (FR4.2)

- Opportunities Tab:

- Read temp/report-improvements-v2/app/reports/[id]/opportunities-table.tsx.

- Update your opportunities-table.tsx and/or components/report/OpportunitiesTab.tsx if the new version includes additional columns (like AI Adoption Score per role) or different visualizations.

- Performance Metrics Tab (New):

- Analyze corresponding component from the sample code (if present) or build a new component.

- Display metrics, showing relevance based on assessment context (Stage/Focus). Use data fetched by the parent page. (FR4.4)

- AI Adoption Score™ Tab (New):

- Analyze corresponding component from the sample code (if present) or build a new component.

- Display the breakdown of score components and ROI calculation. Use charting component (chart.tsx?) from sample if applicable. (FR4.5, FR3.x)

1. Implement Drill-Down (Potentially Deferred):

- This requires more interactive logic (e.g., clicking a role in the matrix/table) to show a modal or separate view with role-specific score components and metrics. Can be added after the main tabs are functional. (FR4.3)

1. Styling and Export:

- Integrate print.css from the sample code (utils/print-styles.ts might also be relevant).

- Ensure Export functions (handleExportPDF, handleExportCSV, etc.) still work and include data from new sections if required. (FR4.6.2)

(Phase 4: Data Input UI & Testing)

1. AI Adoption Score™ Input UI:

- Determine where this data is input. Is it part of the assessment wizard? A separate form linked from the report? A backend integration? Implement the UI accordingly. (FR3.1.1)

1. Testing: Thoroughly test:

- Configuration saving/loading.

- Assessment wizard updates.

- Score component input and saving.

- Report generation with new data and calculations.

- All report tabs and visualizations.

- Filtering/sorting on tables.

- Export functionality.

- Print styles.

# Active Development Context

## Executive PDF Export - Critical Page Break Fixes (January 2025)

### Issue Resolution: Version 1.6 CSS Structure and Page Overlap Problems

**Problem Identified:**
The executive PDF export system had critical CSS syntax errors and structural issues causing:
- Priority Matrix and Strategic Recommendations overlapping on the same page
- Missing closing braces in CSS causing entire rulesets to fail silently
- Ineffective fragmentation controls for large block elements
- Page break controls not applying properly

**Root Causes:**
1. **CSS Syntax Errors:** Missing closing braces at virtually every level in `executive-pdf.css`
2. **Improper Nesting:** CSS selectors improperly nested causing parser failures
3. **JSX Structure Issue:** Matrix and recommendations combined in single `.pdf-page` container
4. **Fragmentation Control:** Missing `break-inside: avoid !important` for critical elements

**Critical Fixes Applied:**

#### 1. CSS Structure Overhaul (`components/report/executive-pdf.css`)
```css
@media print {
  /* --- FRAGMENTATION CONTROL FOR LARGE BLOCKS --- */
  .priority-matrix,
  .matrix-container,
  .matrix-grid,
  .recommendations-table {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    break-after: avoid;
    page-break-after: avoid;
  }
  
  .priority-matrix {
    margin-top: 30pt;
    max-height: 170mm;
    overflow: hidden;
  }
  
  .recommendations-table {
    margin: 16pt 0;
    page-break-before: always;
    break-before: page;
  }
}
```

#### 2. JSX Structure Fix (`components/report/ExecutivePdfLayout.tsx`)
**Before:** Matrix and recommendations combined in PAGE 4
**After:** Split into separate dedicated pages:
```jsx
{/* PAGE 4: Priority Matrix */}
<div className="pdf-page">
  <h1 className="section-title">AI Capability Prioritization Matrix</h1>
  {/* Matrix content only */}
</div>

{/* PAGE 5: Strategic Recommendations */}
<div className="pdf-page">
  <h1 className="section-title">Strategic Recommendations</h1>
  {/* Recommendations table only */}
</div>

{/* PAGE 6: Implementation Roadmap + Tools + Commentary */}
```

#### 3. Data Access Fixes
Fixed TypeScript errors for proper data access:
- `report.organizationName` (not `report.assessment?.organizationName`)
- `report.assessment?.companyStage` (not `report.assessment?.growthStage`)

**Technical Implementation Details:**
- All print fragmentation rules now properly enclosed in `@media print { ... }`
- Enhanced CSS specificity with `!important` for critical break controls
- Added `max-height: 170mm` constraints to prevent content overflow
- Improved page padding (25mm top, 30mm bottom) for proper header/footer spacing
- Enhanced border system with consistent orange gradients on all pages

**Build Verification:**
- All changes compile successfully with `npm run build`
- No TypeScript errors or CSS syntax issues
- Proper component imports maintained (Table, Badge components)

**Impact:**
- Professional 6-page executive PDF report system
- Complete elimination of page break overlap issues
- Robust fragmentation control preventing content splitting
- Executive-quality presentation suitable for C-level stakeholders
- No disruption to existing web interface functionality

**Documentation:**
- Comprehensive implementation documented in `memory-bank/activeContext.md`
- PDF export system ready for production use
- Clear separation between web and PDF rendering systems

