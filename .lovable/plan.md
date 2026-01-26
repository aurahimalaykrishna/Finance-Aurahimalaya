
# Plan: Allow All Team Members to View All Employees

## Problem
Currently, staff members who are added as employees (via the `employees` table with their `user_id`) cannot see other employees in the company. They can only view their own record because:
1. The `has_company_access` function only checks company ownership or explicit `company_access` entries
2. Employees are linked via the `employees` table, not the `company_access` table

## Solution
Update the `has_company_access` database function to also check if a user is an active employee of the company. This will grant company access to anyone who is:
- The owner of the company, OR
- Explicitly granted access in `company_access` table, OR  
- An active employee in the `employees` table

## Technical Changes

### Database Migration
Update the `has_company_access` function to include employees:

```sql
CREATE OR REPLACE FUNCTION public.has_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User owns the company
    SELECT 1 FROM public.companies 
    WHERE id = _company_id AND user_id = _user_id
    UNION
    -- User has been granted access
    SELECT 1 FROM public.company_access 
    WHERE company_id = _company_id AND user_id = _user_id
    UNION
    -- User is an active employee of the company
    SELECT 1 FROM public.employees 
    WHERE company_id = _company_id 
    AND user_id = _user_id 
    AND is_active = true
  )
$$;
```

## Impact
- **All active employees** will automatically be able to view all other employees in their company
- This also applies to other tables that use `has_company_access` (transactions, categories, budgets, etc.)
- Terminated employees (`is_active = false`) will lose company access automatically

## No Code Changes Required
The existing frontend code already uses the `has_company_access` function through RLS policies, so no React/TypeScript changes are needed.
