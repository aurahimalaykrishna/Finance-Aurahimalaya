
# Fix: Attendance Blinking/Infinite Re-render Issue

## Problem Identified
The attendance components are stuck in an infinite re-render loop, causing a blinking loading spinner. The root cause is that `getCompanyAttendanceByDate` and `getMonthlyAttendance` functions from the `useAttendance` hook are included in `useEffect` dependency arrays. Since these functions are created fresh on every render, React detects them as "changed" dependencies and re-runs the effect continuously.

## Solution
Wrap the data-fetching functions in `useCallback` inside the `useAttendance` hook to ensure they maintain stable references across renders. This prevents unnecessary re-triggers of the `useEffect` in the consuming components.

## Changes Required

### 1. Update `src/hooks/useAttendance.ts`
Wrap the following functions with `useCallback`:

| Function | Dependencies for useCallback |
|----------|------------------------------|
| `getMonthlyAttendance` | No external dependencies - wrap with empty array |
| `getCompanyAttendanceByDate` | No external dependencies - wrap with empty array |

```typescript
// Before
const getMonthlyAttendance = async (...) => { ... };

// After
const getMonthlyAttendance = useCallback(async (...) => { ... }, []);
```

### 2. Update `src/components/employees/AttendanceManagement.tsx`
Remove `getCompanyAttendanceByDate` from the `useEffect` dependency array since it will now have a stable reference. Additionally, add proper guards to prevent unnecessary fetch attempts.

### 3. Update `src/components/employees/AttendanceCalendar.tsx`  
Remove `getMonthlyAttendance` from the `useEffect` dependency array since it will now have a stable reference.

---

## Technical Details

### Root Cause Analysis
```text
Render Cycle (BEFORE fix):
  Component renders
       ↓
  useAttendance() creates NEW function references
       ↓
  useEffect dependency array detects "change"
       ↓
  Effect runs → setLoading(true) → fetch → setLoading(false)
       ↓
  State update triggers re-render
       ↓
  (Infinite loop - back to step 1)
```

### After Fix
```text
Render Cycle (AFTER fix):
  Component renders
       ↓
  useAttendance() returns SAME function references (via useCallback)
       ↓
  useEffect dependency array sees NO change
       ↓
  Effect only runs when selectedDate/employeeId changes
       ↓
  Stable behavior - no blinking
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAttendance.ts` | Wrap `getMonthlyAttendance` and `getCompanyAttendanceByDate` with `useCallback` |
| `src/components/employees/AttendanceManagement.tsx` | Remove function from dependency array |
| `src/components/employees/AttendanceCalendar.tsx` | Remove function from dependency array |

---

## Implementation Summary

1. **useAttendance.ts**: Add `useCallback` import and wrap both async functions
2. **AttendanceManagement.tsx**: Update `useEffect` dependencies to `[selectedCompanyId, selectedDate, activeEmployees]`
3. **AttendanceCalendar.tsx**: Update `useEffect` dependencies to `[employeeId, currentMonth]`

This is a common React pattern issue - functions that are returned from hooks must be memoized with `useCallback` if they will be used in dependency arrays of consuming components.
