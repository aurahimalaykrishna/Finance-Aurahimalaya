
# Plan: Add Multiple Roles (Manager, HR Manager, Supervisor)

## Overview
Add three new roles to the existing role system: **Manager**, **HR Manager**, and **Supervisor**. Each role has distinct permissions tailored to their responsibilities. Additionally, fix the existing **Employee** role to work correctly in all areas.

## Role Hierarchy and Permissions

| Role | Priority | Description | Permissions |
|------|----------|-------------|-------------|
| Owner | 1 | Full account control | All permissions |
| Admin | 2 | Full access except user management | manage_settings, manage_companies, edit_data, view_data, delete_data, manage_payroll, approve_leave |
| HR Manager | 3 | Full HR access | manage_employees, manage_payroll, approve_leave, view_data, edit_data, view_own_data, apply_leave |
| Manager | 4 | Team management | approve_leave, view_team_data, view_data, view_own_data, apply_leave |
| Supervisor | 5 | Limited team management | approve_leave, view_team_data, view_own_data, apply_leave |
| Accountant | 6 | Financial data entry | edit_data, view_data, view_own_data, apply_leave |
| Viewer | 7 | Read-only access | view_data, view_own_data |
| Employee | 8 | Self-service only | view_own_data, apply_leave |

### Role Capabilities Summary

```text
+-------------+---------------+-------------+-------------+-----------+------------+
|    Role     | Manage Users  | Manage HR   | Approve     | View Team | View All   |
|             |               |             | Leaves      | Data      | Data       |
+-------------+---------------+-------------+-------------+-----------+------------+
| Owner       |      Yes      |     Yes     |     Yes     |    Yes    |    Yes     |
| Admin       |      No       |     Yes     |     Yes     |    Yes    |    Yes     |
| HR Manager  |      No       |     Yes     |     Yes     |    Yes    |    Yes     |
| Manager     |      No       |     No      |     Yes     |    Yes    |    Yes     |
| Supervisor  |      No       |     No      |     Yes     |    Yes    |    No      |
| Accountant  |      No       |     No      |     No      |    No     |    Yes     |
| Viewer      |      No       |     No      |     No      |    No     |    Yes     |
| Employee    |      No       |     No      |     No      |    No     |    No      |
+-------------+---------------+-------------+-------------+-----------+------------+
```

## Database Changes

### 1. Add New Enum Values
Add `manager`, `hr_manager`, and `supervisor` to the `app_role` enum:

```sql
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor';
```

### 2. Update `get_user_role` Function
Update the ordering to include all 8 roles:

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'hr_manager' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'supervisor' THEN 5
      WHEN 'accountant' THEN 6 
      WHEN 'viewer' THEN 7 
      WHEN 'employee' THEN 8
    END
  LIMIT 1
$$;
```

### 3. Update `get_user_company_role` Function
Same ordering update for company-specific role resolution.

### 4. Update Helper Functions
Update `has_any_role` to handle new roles in RLS policies if needed.

## Frontend Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useUserRoles.ts` | Add new roles to `AppRole` type, update `PERMISSIONS` object |
| `src/contexts/PermissionContext.tsx` | Update `PERMISSIONS` object, add new permission helpers |
| `src/components/users/RoleBadge.tsx` | Add icons and labels for new roles |
| `src/components/users/TeamMemberCard.tsx` | Add new roles to role selector dropdown |
| `src/components/users/InviteUserDialog.tsx` | Add new roles to invitation form |
| `src/pages/UserManagement.tsx` | Add role filter options, add role description cards |

### Updated TypeScript Types

```typescript
export type AppRole = 
  | 'owner' 
  | 'admin' 
  | 'hr_manager'
  | 'manager'
  | 'supervisor'
  | 'accountant' 
  | 'viewer' 
  | 'employee';
```

### Updated Permissions Object

```typescript
const PERMISSIONS = {
  owner: ['manage_users', 'manage_settings', 'manage_companies', 'manage_employees', 
          'manage_payroll', 'approve_leave', 'edit_data', 'view_data', 'view_team_data', 
          'delete_data', 'view_own_data', 'apply_leave'],
  admin: ['manage_settings', 'manage_companies', 'manage_employees', 'manage_payroll', 
          'approve_leave', 'edit_data', 'view_data', 'view_team_data', 'delete_data', 
          'view_own_data', 'apply_leave'],
  hr_manager: ['manage_employees', 'manage_payroll', 'approve_leave', 'edit_data', 
               'view_data', 'view_team_data', 'view_own_data', 'apply_leave'],
  manager: ['approve_leave', 'view_data', 'view_team_data', 'view_own_data', 'apply_leave'],
  supervisor: ['approve_leave', 'view_team_data', 'view_own_data', 'apply_leave'],
  accountant: ['edit_data', 'view_data', 'view_own_data', 'apply_leave'],
  viewer: ['view_data', 'view_own_data'],
  employee: ['view_own_data', 'apply_leave'],
} as const;
```

### Role Badge Configuration

```typescript
const roleConfig: Record<AppRole, { label: string; icon: React.ComponentType; variant: string }> = {
  owner: { label: 'Owner', icon: Crown, variant: 'default' },
  admin: { label: 'Admin', icon: Shield, variant: 'secondary' },
  hr_manager: { label: 'HR Manager', icon: Users, variant: 'secondary' },
  manager: { label: 'Manager', icon: Briefcase, variant: 'outline' },
  supervisor: { label: 'Supervisor', icon: UserCheck, variant: 'outline' },
  accountant: { label: 'Accountant', icon: Calculator, variant: 'outline' },
  viewer: { label: 'Viewer', icon: Eye, variant: 'outline' },
  employee: { label: 'Employee', icon: UserCircle, variant: 'outline' },
};
```

## New Permission Helpers

Add to `PermissionContext.tsx`:

```typescript
interface PermissionContextType {
  // ... existing
  canManageEmployees: boolean;  // HR Manager, Admin, Owner
  canManagePayroll: boolean;    // HR Manager, Admin, Owner
  canApproveLeave: boolean;     // Supervisor+
  canViewTeamData: boolean;     // Supervisor+
}
```

## UI Updates

### Role Selector (TeamMemberCard)
Update dropdown to include all assignable roles:
- Admin
- HR Manager
- Manager
- Supervisor
- Accountant
- Viewer
- Employee

### Invite User Dialog
Same role options for new invitations.

### User Management - Role Permissions Tab
Add cards describing each role:

| Role | Description |
|------|-------------|
| Owner | Full account control including user management |
| Admin | Full access except user management |
| HR Manager | Complete HR access: employees, payroll, leave approvals |
| Manager | Team management: approve leaves, view team data |
| Supervisor | Limited management: approve leaves for assigned team |
| Accountant | Financial data entry and management |
| Viewer | Read-only access to reports and data |
| Employee | Self-service: apply leaves, view own data |

## Implementation Order

1. **Database Migration**
   - Add new enum values
   - Update `get_user_role` function
   - Update `get_user_company_role` function

2. **Type Updates**
   - Update `AppRole` type in `useUserRoles.ts`
   - Update `PERMISSIONS` object

3. **Context Updates**
   - Update `PermissionContext.tsx` with new permissions
   - Add new permission helper methods

4. **UI Component Updates**
   - Update `RoleBadge.tsx` with new role configs
   - Update `TeamMemberCard.tsx` role selector
   - Update `InviteUserDialog.tsx` role options
   - Update `UserManagement.tsx` filters and descriptions

## Security Notes

- All role assignments still require `owner` permission (via RLS on `user_roles` table)
- New roles follow existing RLS patterns
- Database functions use `SECURITY DEFINER` to prevent RLS recursion
- Role hierarchy is enforced via ordering in database functions
