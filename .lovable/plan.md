
# Plan: Integrate Dynamic Leave Types into Employee Portal

## Problem Summary

The Employee Portal's Leave tab is showing leave types and entitlements from hardcoded constants in `nepal-hr-calculations.ts` instead of fetching from the new `company_leave_types` table. This means:

- Companies cannot see their custom leave type configurations
- The leave balance card shows hardcoded values
- The leave request dialog has hardcoded leave options

---

## Files to Modify

| File | Changes Needed |
|------|----------------|
| `src/hooks/useEmployeeLeaves.ts` | Add parameter to accept company leave types and update `calculateAvailableLeave` to use dynamic values |
| `src/components/employees/LeaveBalanceCard.tsx` | Accept leave types as prop instead of using hardcoded constants |
| `src/components/portal/PortalLeave.tsx` | Fetch company leave types and pass to child components |
| `src/components/portal/LeaveRequestDialog.tsx` | Use dynamic leave types from `useCompanyLeaveTypes` |

---

## Implementation Details

### 1. Update `PortalLeave.tsx`

Add the `useCompanyLeaveTypes` hook to fetch leave types for the employee's company:

```typescript
import { useCompanyLeaveTypes } from '@/hooks/useCompanyLeaveTypes';

// Inside component:
const { leaveTypes, isLoading: leaveTypesLoading } = useCompanyLeaveTypes(employee.company_id);

// Pass to LeaveBalanceCard and LeaveRequestDialog
<LeaveBalanceCard
  fiscalYear={fiscalYear}
  availableLeave={availableLeave}
  gender={employee.gender}
  leaveTypes={leaveTypes}  // NEW PROP
/>

<LeaveRequestDialog
  ...
  leaveTypes={leaveTypes}  // NEW PROP
/>
```

### 2. Update `LeaveBalanceCard.tsx`

Replace hardcoded constants with dynamic leave types:

```typescript
interface LeaveBalanceCardProps {
  fiscalYear: string;
  availableLeave: AvailableLeave;
  gender: string;
  leaveTypes?: CompanyLeaveType[];  // NEW PROP
}

// Build leave display from leaveTypes prop
const displayLeaveTypes = leaveTypes
  ?.filter(lt => lt.is_active)
  ?.filter(lt => !lt.gender_restriction || lt.gender_restriction === gender)
  ?.map(lt => ({
    name: lt.name,
    code: lt.code,
    color: lt.color,
    maxLimit: lt.max_accrual || lt.annual_entitlement,
    showCarryForward: lt.max_carry_forward > 0,
    data: getLeaveDataForType(lt.code, availableLeave),
  }));
```

### 3. Update `LeaveRequestDialog.tsx`

Replace hardcoded `leaveTypes` array with dynamic data:

```typescript
interface LeaveRequestDialogProps {
  ...
  leaveTypes?: CompanyLeaveType[];  // NEW PROP
}

// Build options from leaveTypes prop
const leaveOptions = (leaveTypes || [])
  .filter(lt => lt.is_active)
  .filter(lt => !lt.gender_restriction || lt.gender_restriction === employee.gender)
  .map(lt => ({
    value: lt.code,
    label: lt.name,
    available: getAvailableForType(lt.code, availableLeave),
  }));
```

### 4. Update `useEmployeeLeaves.ts`

The `calculateAvailableLeave` function needs to work with dynamic leave types. We have two options:

**Option A:** Keep the current structure but accept entitlements as parameters
**Option B:** Create a new function that builds available leave from company leave types

We will go with **Option A** for backward compatibility:

```typescript
// New function to calculate with dynamic types
const calculateAvailableLeaveWithTypes = (
  balance: LeaveBalance | null, 
  gender: string,
  companyLeaveTypes?: CompanyLeaveType[]
) => {
  if (!balance) return null;

  // If no company leave types, fall back to hardcoded values
  const getEntitlement = (code: string, defaultValue: number) => {
    const lt = companyLeaveTypes?.find(t => t.code === code);
    return lt ? Number(lt.annual_entitlement) : defaultValue;
  };

  // Use dynamic entitlements
  return {
    homeLeave: {
      accrued: balance.home_leave_accrued,
      carryForward: balance.home_leave_carried_forward,
      used: balance.home_leave_used,
      available: balance.home_leave_accrued + balance.home_leave_carried_forward - balance.home_leave_used,
    },
    // ... similar for other types using getEntitlement()
  };
};
```

---

## Data Flow

```text
Employee Portal (/portal)
         │
         ▼
   PortalLeave.tsx
         │
         ├── useCompanyLeaveTypes(company_id) ──► Fetches from company_leave_types table
         │
         ├── useEmployeeLeaves(employee_id) ──► Fetches from employee_leave_balances
         │
         ▼
   LeaveBalanceCard
         │
         └── Displays leave types from company_leave_types
             with balances from employee_leave_balances
```

---

## Database Verification

The `company_leave_types` table already has data for company `9534760e-7712-47d2-9f1f-92c8e2171757`:

| code | name | annual_entitlement | max_accrual |
|------|------|-------------------|-------------|
| home | Home Leave | 18.00 | 90.00 |
| sick | Sick Leave | 12.00 | 45.00 |
| maternity | Maternity Leave | 60.00 | NULL |
| paternity | Paternity Leave | 15.00 | NULL |
| mourning | Mourning Leave | 13.00 | NULL |

---

## Additional Updates Needed

### Update the info box in LeaveBalanceCard

Currently shows hardcoded "Nepal Labour Act 2074 Entitlements". This should be dynamically generated from the company's configured leave types or hidden if company has custom configuration.

### Handle missing leave balance initialization

When a company adds a new leave type, existing employee balances won't have columns for it. The current `employee_leave_balances` table structure is rigid with hardcoded columns. For now, we'll work within this limitation but note that a more flexible schema (using a join table for leave type balances) would be needed for truly dynamic leave types.

---

## Summary of Changes

1. **PortalLeave.tsx**: Import and use `useCompanyLeaveTypes` hook
2. **LeaveBalanceCard.tsx**: Accept `leaveTypes` prop, build display from dynamic data
3. **LeaveRequestDialog.tsx**: Accept `leaveTypes` prop, build options from dynamic data
4. **useEmployeeLeaves.ts**: Add optional parameter for company leave types to `calculateAvailableLeave`

This maintains backward compatibility while enabling dynamic leave type display for companies that have configured their leave types.
