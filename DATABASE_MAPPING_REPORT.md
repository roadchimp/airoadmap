# Database Mapping Report - AI Assessment Wizard

## Overview
This report documents how each field in the 8-step AI Assessment Wizard maps to database tables and fields. This ensures complete data persistence and helps with debugging data flow issues.

## Database Schema Overview
Based on the shared schema (`shared/schema.ts`), the main tables involved are:
- `organizations` - Organization/company information
- `assessments` - Assessment instances
- `job_roles` - Role definitions (pre-populated)
- `departments` - Department definitions (pre-populated)
- Additional tables may be created for assessment responses

## Step-by-Step Field Mapping

### Step 1: Organization Info
**Session Key:** `basics` (OrganizationBasics)

| Wizard Field | Session Property | Database Table | Database Field | Status |
|--------------|------------------|----------------|----------------|--------|
| Organization Name | `basics.name` | `organizations` | `name` | ✅ Mapped |
| Assessment/Report Name | `basics.reportName` | `assessments` | `name` | ⚠️ Needs implementation |
| Industry | `basics.industry` | `organizations` | `industry` | ✅ Mapped |
| Organization Size | `basics.size` | `organizations` | `size` | ✅ Mapped |
| Description | `basics.description` | `organizations` | `description` | ✅ Mapped |
| Industry Maturity | `basics.industryMaturity` | `assessments` | `industry_maturity` | ❌ Missing field |
| Company Stage | `basics.companyStage` | `assessments` | `company_stage` | ❌ Missing field |
| Strategic Focus | `basics.strategicFocus` | `assessments` | `strategic_focus` (JSON) | ❌ Missing field |
| Key Business Goals | `basics.keyBusinessGoals` | `assessments` | `key_business_goals` | ❌ Missing field |
| Key Stakeholders | `basics.keyStakeholders` | `assessments` | `key_stakeholders` (JSON) | ❌ Missing field |

### Step 2: Role Selection
**Session Key:** `roleSelection` (RoleSelection)

| Wizard Field | Session Property | Database Table | Database Field | Status |
|--------------|------------------|----------------|----------------|--------|
| Selected Roles | `roleSelection.selectedRoles` | `assessment_roles` | `role_id` (many-to-many) | ❌ Missing table |

### Step 3: Areas for Improvement
**Session Key:** `areasForImprovement` (AreasForImprovement)

| Wizard Field | Session Property | Database Table | Database Field | Status |
|--------------|------------------|----------------|----------------|--------|
| Selected General Areas | `areasForImprovement.selectedAreas` | `assessments` | `improvement_areas` (JSON) | ❌ Missing field |
| Role Pain Points | `areasForImprovement.roleSpecificPainPoints` | `assessment_pain_points` | Multiple fields | ❌ Missing table |
| - Description | `roleSpecificPainPoints[roleId].description` | `assessment_pain_points` | `description` | ❌ Missing table |
| - Severity (1-5) | `roleSpecificPainPoints[roleId].severity` | `assessment_pain_points` | `severity` | ❌ Missing table |
| - Frequency (1-5) | `roleSpecificPainPoints[roleId].frequency` | `assessment_pain_points` | `frequency` | ❌ Missing table |
| - Impact (1-5) | `roleSpecificPainPoints[roleId].impact` | `assessment_pain_points` | `impact` | ❌ Missing table |
| General Pain Points | `areasForImprovement.generalPainPoints` | `assessments` | `general_pain_points` | ❌ Missing field |

### Step 4: Work Volume & Complexity
**Session Key:** `workVolume` (WorkVolumeData)

| Wizard Field | Session Property | Database Table | Database Field | Status |
|--------------|------------------|----------------|----------------|--------|
| Task Volume (General) | `workVolume.taskVolume` | `assessments` | `task_volume` | ❌ Missing field |
| Task Complexity (General) | `workVolume.taskComplexity` | `assessments` | `task_complexity` | ❌ Missing field |
| Role Work Volume | `workVolume.roleWorkVolume` | `assessment_work_patterns` | Multiple fields | ❌ Missing table |
| - Volume | `roleWorkVolume[roleId].volume` | `assessment_work_patterns` | `volume` | ❌ Missing table |
| - Complexity | `roleWorkVolume[roleId].complexity` | `assessment_work_patterns` | `complexity` | ❌ Missing table |
| - Repetitiveness | `roleWorkVolume[roleId].repetitiveness` | `assessment_work_patterns` | `repetitiveness` | ❌ Missing table |
| - Notes | `roleWorkVolume[roleId].notes` | `assessment_work_patterns` | `notes` | ❌ Missing table |

### Step 5: Data & Systems
**Session Key:** `dataSystems` (DataSystemsData)

| Wizard Field | Session Property | Database Table | Database Field | Status |
|--------------|------------------|----------------|----------------|--------|
| Data Accessibility | `dataSystems.dataAccessibility` | `assessments` | `data_accessibility` | ❌ Missing field |
| Data Quality | `dataSystems.dataQuality` | `assessments` | `data_quality` | ❌ Missing field |
| Systems Integration | `dataSystems.systemsIntegration` | `assessments` | `systems_integration` | ❌ Missing field |
| Relevant Tools | `dataSystems.relevantTools` | `assessments` | `relevant_tools` | ❌ Missing field |
| Notes | `dataSystems.notes` | `assessments` | `data_systems_notes` | ❌ Missing field |

### Step 6: Readiness & Expectations
**Session Key:** `readiness` (ReadinessData)

| Wizard Field | Session Property | Database Table | Database Field | Status |
|--------------|------------------|----------------|----------------|--------|
| Organizational Readiness | `readiness.organizationalReadiness` | `assessments` | `organizational_readiness` | ❌ Missing field |
| Stakeholder Alignment | `readiness.stakeholderAlignment` | `assessments` | `stakeholder_alignment` | ❌ Missing field |
| Training Needs | `readiness.anticipatedTrainingNeeds` | `assessments` | `training_needs` | ❌ Missing field |
| Adoption Challenges | `readiness.expectedAdoptionChallenges` | `assessments` | `adoption_challenges` | ❌ Missing field |
| Success Metrics | `readiness.keySuccessMetrics` | `assessments` | `success_metrics` | ❌ Missing field |

### Step 7: ROI Targets
**Session Key:** `roiTargets` (RoiTargetsData)

| Wizard Field | Session Property | Database Table | Database Field | Status |
|--------------|------------------|----------------|----------------|--------|
| Adoption Rate Forecast | `roiTargets.adoptionRateForecast` | `assessments` | `adoption_rate_forecast` | ❌ Missing field |
| Time Savings | `roiTargets.timeSavings` | `assessments` | `time_savings` | ❌ Missing field |
| Affected Users | `roiTargets.affectedUsers` | `assessments` | `affected_users` | ❌ Missing field |
| Cost Efficiency Gains | `roiTargets.costEfficiencyGains` | `assessments` | `cost_efficiency_gains` | ❌ Missing field |
| Performance Improvement | `roiTargets.performanceImprovement` | `assessments` | `performance_improvement` | ❌ Missing field |
| Tool Sprawl Reduction | `roiTargets.toolSprawlReduction` | `assessments` | `tool_sprawl_reduction` | ❌ Missing field |

### Step 8: Review & Submit
**Session Key:** `reviewSubmit` (ReviewSubmitData)

This step doesn't collect new data but submits the assessment. The submission process should:
1. Create/update the organization record
2. Create the assessment record with all collected data
3. Create related records for roles, pain points, work patterns, etc.

## Required Database Changes

### 1. Extend `assessments` table
Add the following fields to the assessments table:

```sql
ALTER TABLE assessments ADD COLUMN industry_maturity VARCHAR(20);
ALTER TABLE assessments ADD COLUMN company_stage VARCHAR(20);
ALTER TABLE assessments ADD COLUMN strategic_focus JSONB;
ALTER TABLE assessments ADD COLUMN key_business_goals TEXT;
ALTER TABLE assessments ADD COLUMN key_stakeholders JSONB;
ALTER TABLE assessments ADD COLUMN improvement_areas JSONB;
ALTER TABLE assessments ADD COLUMN general_pain_points TEXT;
ALTER TABLE assessments ADD COLUMN task_volume INTEGER;
ALTER TABLE assessments ADD COLUMN task_complexity INTEGER;
ALTER TABLE assessments ADD COLUMN data_accessibility VARCHAR(100);
ALTER TABLE assessments ADD COLUMN data_quality VARCHAR(100);
ALTER TABLE assessments ADD COLUMN systems_integration VARCHAR(100);
ALTER TABLE assessments ADD COLUMN relevant_tools TEXT;
ALTER TABLE assessments ADD COLUMN data_systems_notes TEXT;
ALTER TABLE assessments ADD COLUMN organizational_readiness VARCHAR(100);
ALTER TABLE assessments ADD COLUMN stakeholder_alignment VARCHAR(100);
ALTER TABLE assessments ADD COLUMN training_needs TEXT;
ALTER TABLE assessments ADD COLUMN adoption_challenges TEXT;
ALTER TABLE assessments ADD COLUMN success_metrics TEXT;
ALTER TABLE assessments ADD COLUMN adoption_rate_forecast DECIMAL(5,2);
ALTER TABLE assessments ADD COLUMN time_savings DECIMAL(8,2);
ALTER TABLE assessments ADD COLUMN affected_users INTEGER;
ALTER TABLE assessments ADD COLUMN cost_efficiency_gains DECIMAL(12,2);
ALTER TABLE assessments ADD COLUMN performance_improvement DECIMAL(5,2);
ALTER TABLE assessments ADD COLUMN tool_sprawl_reduction INTEGER CHECK (tool_sprawl_reduction BETWEEN 1 AND 5);
```

### 2. Create `assessment_roles` table
```sql
CREATE TABLE assessment_roles (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES job_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(assessment_id, role_id)
);
```

### 3. Create `assessment_pain_points` table
```sql
CREATE TABLE assessment_pain_points (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES job_roles(id) ON DELETE CASCADE,
  description TEXT,
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),
  frequency INTEGER CHECK (frequency BETWEEN 1 AND 5),
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Create `assessment_work_patterns` table
```sql
CREATE TABLE assessment_work_patterns (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES job_roles(id) ON DELETE CASCADE,
  volume VARCHAR(20), -- 'low', 'medium', 'high'
  complexity VARCHAR(20), -- 'low', 'medium', 'high'
  repetitiveness INTEGER CHECK (repetitiveness BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Summary
- ✅ **4 fields** are already mapped to existing database structure
- ❌ **25+ fields** need database schema updates
- ❌ **3 new tables** need to be created for relational data

## Next Steps
1. Run the database migration scripts above
2. Update the submission API (`/api/assessment/submit`) to handle all new fields
3. Update the schema definitions in `shared/schema.ts`
4. Test data persistence for each step

## Files to Update
- `shared/schema.ts` - Add new table definitions
- `server/pg-storage.ts` - Add new insert/update methods
- `app/api/assessment/submit/route.ts` - Handle all wizard data
- Create migration files for database changes 