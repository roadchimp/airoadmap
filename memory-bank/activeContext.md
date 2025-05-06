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
