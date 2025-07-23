# Role Data Format Fix - Technical Details

## Issue Summary
Fixed critical role data format mismatch that was causing React errors and role lookup failures during report generation.

## Root Cause Analysis

### The Data Flow Problem
```
Wizard Session: JobRole[] (full objects with id, title, departmentId, etc.)
       ↓
Submit Route: number[] (IDs only) ← TRANSFORMATION HAPPENS HERE
       ↓  
Database: number[] (stored as IDs in stepData.roles.selectedRoles)
       ↓
Prioritization Engine: Expects JobRole[] (full objects) ← MISMATCH!
```

### Key Issue Location
**File:** `app/api/assessment/submit/route.ts` (line 103-104)
```typescript
roles: {
  selectedDepartments: [],
  selectedRoles: roleStep.roleSelection?.selectedRoles?.map((role: any) => role.id) || [], // ⚠️ CONVERTS TO IDs ONLY
  prioritizedRoles: roleStep.roleSelection?.selectedRoles?.map((role: any) => role.id) || [],
}
```

## Solutions Implemented

### 1. React Error #31 Fix
**Problem:** Objects being passed as React children causing crashes
**Files:** `app/(app)/assessment/[id]/view/_components/assessment-view-client.tsx`

**Changes:**
- Enhanced `InfoItem` component with type-safe object handling
- Updated `InfoList` component to handle arrays of objects
- Added `renderArray` helper with proper type checking
- Fixed stakeholder rendering to handle both strings and objects with `.name` property

### 2. Role Lookup Fix
**Problem:** Prioritization engine expected full role objects but received IDs
**Files:** 
- `server/lib/engines/prioritizationEngine.ts`
- `server/pg-storage.ts`
- `app/api/reports/[id]/populate-filters/route.ts`
- `lib/prioritizationEngine.ts`

**Changes:**
- Updated prioritization engine to fetch role data from database
- Added proper type casting: `(stepData.roles?.selectedRoles as unknown as number[])`
- Fixed role map building to use database-fetched role data
- Updated all dependent files to handle role IDs correctly

## Technical Implementation Details

### Type Casting Solution
```typescript
// Before (expected objects)
const selectedRoles = stepData.roles?.selectedRoles || [];

// After (handle runtime IDs)
const selectedRoleIds = (stepData.roles?.selectedRoles as unknown as number[]) || [];
```

### Database Lookup Pattern
```typescript
// Fetch all roles from database
const allRoles = await storage.listJobRoles();

// Build role map using fetched data
selectedRoleIds.forEach(roleId => {
  if (typeof roleId === 'number') {
    const roleData = allRoles.find(r => r.id === roleId);
    if (roleData) {
      roleMap.set(roleId, {
        id: roleData.id,
        title: roleData.title,
        department: roleData.departmentName || `Department ${roleData.departmentId}`,
      });
    }
  }
});
```

## Impact & Results

### Before Fix
- ❌ React error #31 crashes on assessment views
- ❌ Console logs: "undefined (ID: undefined)" 
- ❌ Role lookup failures: "Could not find role data for prioritized role ID: 18, 6, 24"
- ❌ 0 selected roles for capability mapping

### After Fix
- ✅ Assessment views load without crashes
- ✅ Console logs: "Compliance Officer (ID: 18)"
- ✅ Successful role lookup and mapping
- ✅ Proper role count and capability mapping

## Files Modified
1. `app/(app)/assessment/[id]/view/_components/assessment-view-client.tsx` - React error fixes
2. `server/lib/engines/prioritizationEngine.ts` - Main role lookup fix
3. `server/pg-storage.ts` - Role ID extraction update
4. `app/api/reports/[id]/populate-filters/route.ts` - Role title lookup
5. `lib/prioritizationEngine.ts` - Legacy engine update

## Prevention Notes
- This issue occurred due to schema types not matching runtime data formats
- The `WizardStepData` schema expects `JobRole[]` but submission process converts to `number[]`
- Future schema updates should align with actual data transformations
- Consider updating schema to reflect runtime format or keeping full objects