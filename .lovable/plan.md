
# Plan: Link User Accounts with Employee Records

## Overview
Add the ability to link existing user accounts to employee records. When linked, the user automatically gets the `employee` role and can access their own profile, leave balance, and payslips through the Employee Portal.

## Current System Analysis

The `employees` table has a `user_id` column that currently stores the **creator** of the record (the admin who added the employee). This will be repurposed to store the **linked user** instead, enabling employee self-service.

The `has_company_access` function already includes logic to grant company access to active employees:
```sql
SELECT 1 FROM public.employees 
WHERE company_id = _company_id 
AND user_id = _user_id 
AND is_active = true
```

## Database Changes

### 1. Add Trigger for Auto-Assigning Employee Role
When an employee is linked to a user account (via `user_id`), automatically assign them the `employee` role if they don't already have one.

```sql
-- Function to add employee role when linked
CREATE OR REPLACE FUNCTION handle_employee_user_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if user_id changed and new value is not null
  IF NEW.user_id IS DISTINCT FROM OLD.user_id AND NEW.user_id IS NOT NULL THEN
    -- Check if user already has a role
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id
    ) THEN
      -- Insert employee role
      INSERT INTO public.user_roles (user_id, role, granted_by)
      VALUES (NEW.user_id, 'employee', auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on employee updates
CREATE TRIGGER on_employee_user_link
  AFTER INSERT OR UPDATE OF user_id ON employees
  FOR EACH ROW
  EXECUTE FUNCTION handle_employee_user_link();
```

## Frontend Changes

### 1. Create UserSelect Component
A new combobox component to search and select team members (users with profiles).

| Property | Description |
|----------|-------------|
| `value` | Currently selected user ID |
| `onValueChange` | Callback when selection changes |
| `companyId` | Filter users by company access |
| `excludeIds` | Array of user IDs to exclude (already linked employees) |

### 2. Update Employee Interface
Add `linked_user_id` concept to distinguish between:
- **Created by**: The admin who added the employee (track separately if needed)
- **Linked user**: The actual user account of this employee

### 3. Update EmployeeDialog
Add a new "Account" tab or section in the dialog:

```text
+---------------------------------------------------+
| Link User Account (Optional)                       |
|                                                    |
| Search user by email: [_____________________] [v] |
|                                                    |
| Selected: ishan@company.com                       |
|                                                    |
| When linked, this user can:                       |
|  - View their own employee profile                |
|  - Apply for leaves via Employee Portal           |
|  - View their payslips and attendance             |
+---------------------------------------------------+
```

### 4. Update EmployeeList
Show linked user status in the employee table:
- Display email if linked
- Show "Not linked" indicator if no user account

### 5. Update CreateEmployeeData Interface
```typescript
interface CreateEmployeeData {
  // ... existing fields
  linked_user_id?: string | null; // User account to link
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/employees/UserSelect.tsx` | **New** - Combobox to search/select users |
| `src/hooks/useTeamUsers.ts` | **New** - Hook to fetch available team members |
| `src/components/employees/EmployeeDialog.tsx` | Add user linking section |
| `src/hooks/useEmployees.ts` | Handle linked_user_id in create/update |
| `src/components/employees/EmployeeList.tsx` | Show linked user email column |
| `src/components/employees/EmployeeProfile.tsx` | Show linked account info |

## New Hook: useTeamUsers

```typescript
// Fetch users that can be linked to employees
export function useTeamUsers(companyId?: string) {
  // Returns list of team members from profiles table
  // Filters by company access if companyId provided
  // Includes: id, email, full_name
}
```

## New Component: UserSelect

```typescript
interface UserSelectProps {
  value?: string | null;
  onValueChange: (userId: string | null) => void;
  excludeIds?: string[];
  disabled?: boolean;
  placeholder?: string;
}
```

Features:
- Searchable dropdown
- Shows user email and name
- Option to clear selection
- Excludes already-linked employees

## UI Flow

```text
+------------------+
| Add Employee     |
+------------------+
        |
        v
+------------------+     +------------------+
| Fill Personal    | --> | Fill Employment  |
| Details          |     | Details          |
+------------------+     +------------------+
        |
        v
+------------------+
| Fill Financial   |
| Details          |
+------------------+
        |
        v
+------------------+
| Link User        |  <-- Optional step
| (Select email)   |
+------------------+
        |
        v
+------------------+
| Save Employee    |
+------------------+
        |
        v (if linked)
+------------------+
| Auto-assign      |
| 'employee' role  |
+------------------+
```

## Implementation Steps

1. **Database**: Create trigger for auto-assigning employee role
2. **Hook**: Create `useTeamUsers` hook to fetch available users
3. **Component**: Create `UserSelect` combobox component
4. **Dialog**: Add user linking section to EmployeeDialog
5. **List**: Update EmployeeList to show linked user info
6. **Profile**: Show linked account in EmployeeProfile

## Security Notes

- The `user_id` column on `employees` will now represent the linked user account
- The current RLS policies already allow viewing employees by company access
- The trigger uses `SECURITY DEFINER` to safely insert the employee role
- Only users with `has_company_access` can manage employees

## Benefits

After implementation:
1. Employees can log into the system with their own account
2. They access the Employee Portal to view their profile
3. They can apply for leaves and track balances
4. Admins can manage which users are linked to which employees
5. Access is automatically revoked when an employee is terminated (since `is_active` becomes false)
