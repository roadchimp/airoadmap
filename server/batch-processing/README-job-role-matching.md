# AI Capability to Job Role Matching - Batch Processing

This feature automatically matches AI capabilities to relevant job roles using OpenAI's batch processing API. This enables role-based filtering in reports and better capability recommendations.

## Overview

The system now supports:
1. **Automatic job role matching** for newly processed capabilities
2. **Batch processing** of all existing capabilities 
3. **Role-based filtering** in capability reports

## Database Schema

### Tables Involved

- `ai_capabilities` - Contains all AI capabilities
- `job_roles` - Contains job roles by department
- `capability_job_roles` - Junction table linking capabilities to roles
- `capability_role_impacts` - Stores impact scores per role (optional)

### Key Fields

```sql
-- capability_job_roles table
CREATE TABLE capability_job_roles (
    capability_id INTEGER REFERENCES ai_capabilities(id),
    job_role_id INTEGER REFERENCES job_roles(id),
    PRIMARY KEY (capability_id, job_role_id)
);
```

## How It Works

### 1. For New Capabilities (Automatic)

When processing job descriptions through the existing batch processor:

```bash
# Regular job processing now includes role matching
npx tsx server/batch-processing/batchProcessor.ts export-jobs
# Submit to OpenAI...
npx tsx server/batch-processing/batchProcessor.ts process-jobs <response_file>
```

The `processJobBatchResults` function now automatically:
- Creates new capabilities from job analysis
- Matches them to relevant job roles
- Populates the `capability_job_roles` table

### 2. For Existing Capabilities (One-time Setup)

To process all existing capabilities for job role matching:

```bash
# Step 1: Generate batch file for existing capabilities
npx tsx server/batch-processing/populate-existing-capabilities.ts

# Step 2: Submit the JSONL file to OpenAI for batch processing
# (Manual step - upload file and create batch job)

# Step 3: Process the OpenAI response
npx tsx server/batch-processing/batchProcessor.ts process-job-roles <response_file>
```

### 3. Standalone Job Role Matching

For processing capabilities independently:

```bash
# Export capabilities for job role matching
npx tsx server/batch-processing/batchProcessor.ts export-job-roles

# Process the results
npx tsx server/batch-processing/batchProcessor.ts process-job-roles <response_file>
```

## OpenAI Prompt Strategy

The system uses a sophisticated prompt that:

1. **Analyzes each capability** for its core functionality and benefits
2. **Matches to job roles** based on:
   - Direct applicability (who would use this capability)
   - Impact potential (how much it would benefit the role)
   - Relevance threshold (minimum 30/100 impact score)
3. **Provides impact scores** (1-100) for each matching role
4. **Includes rationale** for each match

### Example Response Format

```json
{
  "capability_id": 123,
  "job_role_matches": [
    {
      "job_role_id": 45,
      "impact_score": 85,
      "rationale": "Marketing managers would benefit significantly from automated social media content generation"
    },
    {
      "job_role_id": 67,
      "impact_score": 60,
      "rationale": "Content creators could use this for initial draft generation"
    }
  ]
}
```

## Benefits

### For Users
- **Role-specific recommendations** - See only relevant capabilities
- **Better prioritization** - Focus on high-impact capabilities for your role
- **Departmental views** - Filter by department or specific roles

### For Reports
- **Enhanced filtering** - Role/department-based capability filtering
- **Targeted analysis** - Role-specific priority matrices
- **Better insights** - Impact analysis per role type

### For Organizations
- **Department-specific roadmaps** - Tailored AI adoption strategies
- **Resource planning** - Role-based capability budgeting
- **Change management** - Role-specific training needs

## File Structure

```
server/batch-processing/
├── batchProcessor.ts              # Main batch processing logic
├── populate-existing-capabilities.ts  # One-time setup script
├── README-job-role-matching.md   # This documentation
├── requests/                     # Generated JSONL files
├── responses/                    # OpenAI response files
└── logs/                        # Processing logs and manifests
```

## API Integration

The job role matching integrates with existing storage methods:

```typescript
// New storage methods
await storage.mapCapabilityToJobRole(capabilityId, jobRoleId);
await storage.getJobRolesForCapability(capabilityId);
await storage.unmapCapabilityFromJobRole(capabilityId, jobRoleId);
```

## Monitoring and Logs

### Manifest Files
Each batch processing run creates a manifest file with:
- Capability IDs processed
- Processing timestamp
- Success/error counts
- Mapping statistics

### Log Output
```
Capability-job role matching complete. 
Successfully processed: 150, Errors: 2, Mappings: 423
```

## Troubleshooting

### Common Issues

1. **No job roles found**
   - Ensure job roles are populated in the database
   - Check department data is available

2. **Low match rates**
   - Review capability descriptions for clarity
   - Adjust impact score threshold (currently 30/100)

3. **Processing errors**
   - Check OpenAI API response format
   - Verify capability and job role IDs exist

### Validation

Check the results:
```sql
-- Count mappings per capability
SELECT c.name, COUNT(cjr.job_role_id) as role_count
FROM ai_capabilities c
LEFT JOIN capability_job_roles cjr ON c.id = cjr.capability_id
GROUP BY c.id, c.name
ORDER BY role_count DESC;

-- Check role coverage
SELECT jr.title, COUNT(cjr.capability_id) as capability_count
FROM job_roles jr
LEFT JOIN capability_job_roles cjr ON jr.id = cjr.job_role_id
GROUP BY jr.id, jr.title
ORDER BY capability_count DESC;
```

## Future Enhancements

1. **Impact score storage** - Store and display impact scores per role
2. **Confidence scoring** - Add matching confidence levels
3. **Dynamic re-matching** - Automatically re-process when job roles change
4. **Skill-based matching** - Include required skills in matching logic
5. **Department weights** - Department-specific impact scoring 