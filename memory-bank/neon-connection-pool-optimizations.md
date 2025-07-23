# Neon Connection Pool Optimizations - Report Generation Fix

## Problem Analysis
The report generation process was experiencing connection pool saturation in Vercel's serverless environment, causing `TIMEOUT_ERR: 23` errors. Root cause:

- **7 concurrent OpenAI API calls** (this part worked fine)
- **Each AI result processed through individual DB operations** = 60-70 connections in <1 second
- **Neon free tier PgBouncer pool limit**: ~100 connections with 120s `query_wait_timeout`
- **Pool exhaustion** → queries wait in queue → timeout after 120s

## Optimizations Implemented

### 1. Connection Throttling with p-limit
```typescript
import pLimit from 'p-limit';
const dbWriteLimit = pLimit(4); // Max 4 concurrent DB writes instead of 60-70
```

**Impact**: Reduces concurrent database operations from 60-70 to maximum 4 at any time.

### 2. Batch Database Operations
**Before**: Individual calls for each role mapping
```typescript
for (const roleId of assessmentRoleIds) {
  await storage.mapCapabilityToJobRoleWithImpact(globalCapability.id, roleId, impactScore);
}
```

**After**: Single batch operation
```typescript
const mappings = assessmentRoleIds.map(roleId => ({ jobRoleId: roleId, impactScore }));
await storage.batchMapCapabilityToJobRolesWithImpact(globalCapability.id, mappings);
```

**Impact**: Reduces N×M individual inserts to single batch insert per capability.

### 3. New Storage Method: `batchMapCapabilityToJobRolesWithImpact()`
Added to `server/storage.ts` interface and `server/pg-storage.ts` implementation:
- Batch inserts capability-job role mappings
- Batch inserts impact scores with conflict resolution
- Uses single transaction instead of multiple individual operations

### 4. Enhanced Monitoring and Logging
- Added timing logs for AI API calls vs DB write phases
- Connection throttling progress tracking
- Performance metrics to identify bottlenecks

## Technical Details

### Files Modified
1. **`server/lib/engines/prioritizationEngine.ts`**
   - Added p-limit import and connection throttling
   - Refactored capability saving into `saveCapabilityWithMappings()` helper
   - Implemented batch processing for all capability operations
   - Added performance timing logs

2. **`server/storage.ts`**
   - Added `batchMapCapabilityToJobRolesWithImpact()` interface method

3. **`server/pg-storage.ts`**
   - Implemented batch mapping method with proper conflict resolution
   - Uses `onConflictDoUpdate` for impact scores
   - Wrapped in retry logic for connection resilience

### Expected Connection Reduction
**Before**: 
- 3 top roles × 5 avg capabilities × 3 assessment roles × 3 DB calls each = ~135 connections
- Plus individual mapping calls = 60-70 concurrent connections

**After**:
- Maximum 4 concurrent operations via p-limit throttling
- Batch operations reduce individual calls by ~80%
- Estimated: 4-8 concurrent connections maximum

### Performance Expectations
- **AI API Phase**: ~5-15 seconds (unchanged, runs in parallel)
- **DB Write Phase**: Previously 60-90s → Expected <10s with throttling
- **Total Report Generation**: Should stay within 120s Vercel timeout
- **Connection Pool**: Should never exceed 10-15 active connections

## Monitoring Recommendations

### Log Analysis
Look for these key metrics in production logs:
```
[PrioritizationEngine] Completed all 7 AI API calls in {ai_duration}ms
[PrioritizationEngine] Database write phase completed in {db_duration}ms with connection throttling
```

### Connection Pool Health Check
If connection issues persist, run this query during report generation:
```sql
SELECT now(), sum(waiting) AS queue_len, sum(active) AS in_use
FROM pgbouncer_pools
WHERE database = current_database();
```

### Success Indicators
- `db_duration` consistently under 10,000ms
- `queue_len` stays under 10
- No more `TIMEOUT_ERR: 23` errors
- Successful report generation within 120s timeout

## Additional Recommendations

### Future Optimizations (if needed)
1. **Direct Connection for Heavy Jobs**: Use non-pooler URL for report generation
2. **Background Functions**: Move to Vercel Background Functions for 900s timeout
3. **Database Caching**: Cache role/capability lookups during processing
4. **Connection Reuse**: Implement single long-lived connection per report

### Platform Configuration
- ✅ Vercel timeout increased to 120s in `vercel.json`
- ✅ p-limit throttling at 4 concurrent operations
- ✅ Retry logic with exponential backoff
- ✅ Connection pooling with `-pooler` suffix detection

This optimization should resolve the connection pool saturation while maintaining the parallel AI processing that makes reports generate efficiently.