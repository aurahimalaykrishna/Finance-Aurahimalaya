
# Plan: Leave Type Configuration CRUD

## Overview

Build a complete Leave Type Configuration system that allows companies to create, read, update, and delete custom leave types. This replaces the current hardcoded leave entitlements with a flexible, company-specific configuration.

---

## Current State

Currently, leave types are hardcoded in `src/lib/nepal-hr-calculations.ts`:

| Leave Type | Default Entitlement |
|------------|---------------------|
| Home Leave | 1 day per 20 working days (max 90) |
| Sick Leave | 12 days/year (max 45) |
| Maternity | 60 days paid |
| Paternity | 15 days |
| Mourning | 13 days |
| Public Holiday | 13-14 days |

**Problem**: Companies cannot customize these values or add new leave types like "Casual Leave", "Study Leave", etc.

---

## What We Will Build

### 1. Database Schema

Create a new `company_leave_types` table to store configurable leave types per company:

```sql
CREATE TABLE public.company_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Leave type identification
  code TEXT NOT NULL,           -- 'home', 'sick', 'casual', etc.
  name TEXT NOT NULL,           -- 'Home Leave', 'Sick Leave', etc.
  
  -- Entitlement configuration
  annual_entitlement DECIMAL(5,2) NOT NULL DEFAULT 0,
  max_accrual DECIMAL(5,2),     -- NULL means unlimited
  max_carry_forward DECIMAL(5,2) DEFAULT 0,
  
  -- Accrual settings
  accrual_type TEXT NOT NULL DEFAULT 'annual',  -- 'annual', 'monthly', 'per_working_days'
  accrual_rate DECIMAL(5,2),    -- For per_working_days: days earned per N working days
  accrual_per_days INTEGER,     -- N working days required for accrual
  
  -- Gender restrictions
  gender_restriction TEXT,      -- NULL = all, 'male', 'female'
  
  -- Leave behavior
  is_paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Display
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'calendar',
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, code)
);
```

### 2. Default Leave Types Initialization

When a company enables HR features, auto-create default Nepal Labour Act leave types:

| Code | Name | Annual | Max Accrual | Carry Forward | Accrual Type |
|------|------|--------|-------------|---------------|--------------|
| home | Home Leave | 18 | 90 | 90 | per_working_days (1 per 20) |
| sick | Sick Leave | 12 | 45 | 45 | monthly |
| maternity | Maternity Leave | 60 | - | 0 | annual (female only) |
| paternity | Paternity Leave | 15 | - | 0 | annual (male only) |
| mourning | Mourning Leave | 13 | - | 0 | annual |

### 3. RLS Policies

```sql
-- View: All company members can see leave types
CREATE POLICY "Users can view company leave types"
ON public.company_leave_types FOR SELECT
USING (has_company_access(auth.uid(), company_id));

-- Manage: Only Owners, Admins, HR Managers can manage
CREATE POLICY "Admins can manage company leave types"
ON public.company_leave_types FOR ALL
USING (
  has_company_access(auth.uid(), company_id) AND 
  has_any_role(auth.uid(), ARRAY['owner', 'admin', 'hr_manager']::app_role[])
);
```

---

## UI Design

### Location: Company Profile > HR Settings Tab

Add a new "HR Settings" tab to the Company Profile page:

```text
Company Profile
├── Overview
├── Team
├── Transactions
├── Bank Accounts
├── Categories
└── HR Settings  <-- NEW TAB
    └── Leave Types
```

### Leave Types Management UI

```text
+------------------------------------------------------------------+
| Leave Types Configuration                         [+ Add Leave]  |
+------------------------------------------------------------------+
| Drag to reorder                                                   |
+------------------------------------------------------------------+
| ≡  Home Leave          | 18 days/year | Max: 90  | [Edit] [Delete]|
| ≡  Sick Leave          | 12 days/year | Max: 45  | [Edit] [Delete]|
| ≡  Maternity Leave     | 60 days      | Female   | [Edit] [Delete]|
| ≡  Paternity Leave     | 15 days      | Male     | [Edit] [Delete]|
| ≡  Mourning Leave      | 13 days      | -        | [Edit] [Delete]|
+------------------------------------------------------------------+
```

### Add/Edit Leave Type Dialog

```text
+------------------------------------------+
| Add Leave Type                           |
+------------------------------------------+
| Leave Code *        [casual_leave    ]   |
| Leave Name *        [Casual Leave    ]   |
|                                          |
| --- Entitlement ---                      |
| Annual Days *       [    10         ]    |
| Max Accrual         [    20         ]    |
| Carry Forward       [     5         ]    |
|                                          |
| --- Accrual Type ---                     |
| ( ) Annual - All days at year start     |
| ( ) Monthly - Proportional by month      |
| ( ) Per Working Days                     |
|     Days earned: [1] per [20] work days  |
|                                          |
| --- Restrictions ---                     |
| Gender: [All Employees      ▼]           |
|                                          |
| [x] Paid Leave                           |
| [x] Requires Approval                    |
| [x] Active                               |
|                                          |
|                  [Cancel] [Save Leave]   |
+------------------------------------------+
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useCompanyLeaveTypes.ts` | CRUD mutations and queries for leave types |
| `src/components/company/profile/CompanyHRSettings.tsx` | HR Settings tab content |
| `src/components/company/profile/LeaveTypeDialog.tsx` | Add/Edit leave type dialog |
| `src/components/company/profile/LeaveTypeCard.tsx` | Individual leave type display card |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CompanyProfile.tsx` | Add "HR Settings" tab |
| `src/hooks/useEmployeeLeaves.ts` | Fetch leave types from DB instead of constants |
| `src/components/portal/LeaveRequestDialog.tsx` | Use dynamic leave types from DB |
| `src/components/employees/ManageLeaveBalanceDialog.tsx` | Use dynamic leave types |
| `src/lib/nepal-hr-calculations.ts` | Keep as fallback/defaults, add initialization function |

---

## Database Migration

```sql
-- Create leave types table
CREATE TABLE public.company_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  annual_entitlement DECIMAL(5,2) NOT NULL DEFAULT 0,
  max_accrual DECIMAL(5,2),
  max_carry_forward DECIMAL(5,2) DEFAULT 0,
  accrual_type TEXT NOT NULL DEFAULT 'annual' 
    CHECK (accrual_type IN ('annual', 'monthly', 'per_working_days')),
  accrual_rate DECIMAL(5,2),
  accrual_per_days INTEGER,
  gender_restriction TEXT CHECK (gender_restriction IN ('male', 'female') OR gender_restriction IS NULL),
  is_paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'calendar',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Enable RLS
ALTER TABLE public.company_leave_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company leave types"
ON public.company_leave_types FOR SELECT
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "HR can insert company leave types"
ON public.company_leave_types FOR INSERT
WITH CHECK (
  has_company_access(auth.uid(), company_id) AND 
  has_any_role(auth.uid(), ARRAY['owner', 'admin', 'hr_manager']::app_role[])
);

CREATE POLICY "HR can update company leave types"
ON public.company_leave_types FOR UPDATE
USING (
  has_company_access(auth.uid(), company_id) AND 
  has_any_role(auth.uid(), ARRAY['owner', 'admin', 'hr_manager']::app_role[])
);

CREATE POLICY "HR can delete company leave types"
ON public.company_leave_types FOR DELETE
USING (
  has_company_access(auth.uid(), company_id) AND 
  has_any_role(auth.uid(), ARRAY['owner', 'admin', 'hr_manager']::app_role[])
);

-- Trigger for updated_at
CREATE TRIGGER update_company_leave_types_updated_at
  BEFORE UPDATE ON public.company_leave_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Implementation Flow

### Step 1: Database Setup
- Create `company_leave_types` table with RLS policies

### Step 2: Hook Implementation
```typescript
// useCompanyLeaveTypes.ts
export function useCompanyLeaveTypes(companyId?: string) {
  // Query all leave types for company
  const { data: leaveTypes } = useQuery({...});
  
  // Mutations
  const createLeaveType = useMutation({...});
  const updateLeaveType = useMutation({...});
  const deleteLeaveType = useMutation({...});
  const initializeDefaults = useMutation({...});
  
  return { leaveTypes, createLeaveType, updateLeaveType, deleteLeaveType, initializeDefaults };
}
```

### Step 3: UI Components
1. Add "HR Settings" tab to CompanyProfile
2. Create LeaveTypeDialog for add/edit
3. Create list view with edit/delete actions

### Step 4: Integration
- Update LeaveRequestDialog to fetch leave types from DB
- Update ManageLeaveBalanceDialog to use dynamic types
- Update leave balance calculations to use configured values

---

## Employee Portal Integration

The Employee Portal will automatically show the leave types configured for their company:

```text
Before (hardcoded):        After (dynamic):
+------------------+       +------------------+
| Home Leave: 5    |       | Home Leave: 5    |
| Sick Leave: 8    |       | Sick Leave: 8    |
| Maternity: 60    |       | Casual Leave: 10 | <-- Custom type
+------------------+       | Study Leave: 5   | <-- Custom type
                           +------------------+
```

---

## Data Flow

```text
Admin creates leave type
        ↓
Stored in company_leave_types table
        ↓
useCompanyLeaveTypes fetches for company
        ↓
Displayed in:
  - Company Profile > HR Settings (admin view)
  - Employee Portal > Apply Leave (employee view)
  - Manager > Leave Requests Queue (manager view)
```

---

## Security Considerations

1. **Role-based access**: Only Owner, Admin, HR Manager can create/edit/delete leave types
2. **Company isolation**: Each company has its own leave types via RLS
3. **Validation**: Code uniqueness enforced at DB level per company
4. **Soft delete option**: `is_active` flag allows disabling without data loss

---

## Benefits

1. **Flexibility**: Companies can define custom leave types (Casual, Study, Comp Off, etc.)
2. **Compliance**: Different companies can have different Nepal Labour Act interpretations
3. **Scalability**: Easy to add new leave types without code changes
4. **Audit Trail**: Database tracks created_at/updated_at for all changes
