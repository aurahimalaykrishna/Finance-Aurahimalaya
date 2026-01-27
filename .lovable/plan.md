
# Plan: Employee Self-Service Portal

## Overview
Create a dedicated Employee Portal that allows employees (users with the 'employee' role) to access their personal work information including attendance tracking, leave applications, payroll/payslips, and company holidays - all from a single, streamlined interface.

## Current State Analysis

### What Already Exists
| Feature | Status | Location |
|---------|--------|----------|
| Employee role & permissions | Implemented | `useUserRoles.ts`, `PermissionContext.tsx` |
| Attendance check-in/out | Implemented | `AttendancePanel.tsx`, `useAttendance.ts` |
| Attendance calendar | Implemented | `AttendanceCalendar.tsx` |
| Leave balances | Implemented | `LeaveBalanceCard.tsx`, `useEmployeeLeaves.ts` |
| Leave request creation | Implemented | `useEmployeeLeaves.ts` |
| Payslips table | Exists | `employee_payslips` table with RLS |
| Holiday marking (admin) | Implemented | `AttendanceManagement.tsx` |

### What Needs to Be Built
| Feature | Description |
|---------|-------------|
| Employee Portal Page | New `/portal` route for employee self-service |
| My Payslips view | Component to display employee's own payslips |
| Leave Request Form | UI to submit new leave applications |
| Company Holidays List | Display upcoming and past company holidays |
| Role-based Navigation | Show Portal link only for employees, hide admin features |
| RLS for Employee Payslip Access | Allow employees to view their own payslips |

## System Architecture

```text
+------------------+     +-------------------+     +-----------------+
|  Employee Portal |---->|   useMyEmployee   |---->|   employees     |
|  (New Page)      |     |   (New Hook)      |     |   (Database)    |
+------------------+     +-------------------+     +-----------------+
        |                         |
        v                         v
+------------------+     +-------------------+     +-----------------+
| Attendance Panel |     | useEmployeeLeaves |---->| leave_requests  |
| (Existing)       |     | (Existing)        |     | (Database)      |
+------------------+     +-------------------+     +-----------------+
        |
        v
+------------------+     +-------------------+     +-----------------+
| PayslipViewer    |---->|  useMyPayslips    |---->| employee_payslips|
| (New Component)  |     |  (New Hook)       |     | (Database)       |
+------------------+     +-------------------+     +-----------------+
        |
        v
+------------------+     +-------------------+     +-----------------+
| HolidaysList     |---->| useCompanyHolidays|---->| company_holidays |
| (New Component)  |     | (New Hook)        |     | (New Table)      |
+------------------+     +-------------------+     +-----------------+
```

## Feature Details

### 1. Employee Portal Page
A dedicated dashboard for employees with:
- Welcome header with employee name and current date
- Quick actions: Check-in/Check-out
- Today's attendance status
- Leave balance summary
- Recent payslips
- Upcoming holidays

### 2. My Attendance Section
- Check-in/Check-out buttons (reuses existing `AttendancePanel`)
- Monthly attendance calendar (reuses existing `AttendanceCalendar`)
- Monthly summary statistics

### 3. Leave Application Section
- View current leave balances by type
- Apply for new leave with:
  - Leave type selection
  - Date range picker
  - Reason input
- View pending/approved/rejected requests

### 4. Payslip Viewer
- List of payslips by month
- View detailed breakdown:
  - Gross salary, allowances
  - Deductions (SSF, tax)
  - Net salary
- Download/print payslip option (future enhancement)

### 5. Company Holidays Section
- List of declared public holidays
- Calendar view showing holidays
- Filter by upcoming/past

## Database Changes

### New Table: `company_holidays`
Stores company-wide declared holidays for display to employees.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| company_id | uuid | Foreign key to companies |
| name | text | Holiday name (e.g., "Dashain") |
| date | date | Holiday date |
| description | text | Optional description |
| created_by | uuid | Who created the record |
| created_at | timestamptz | Created timestamp |

### RLS Policies for `company_holidays`
- All company members can view holidays
- Only admins can create/update/delete

### Update RLS for `employee_payslips`
Add policy allowing employees to view their own payslips:
```sql
CREATE POLICY "Employees can view own payslips"
ON public.employee_payslips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_payslips.employee_id 
    AND e.user_id = auth.uid()
  )
);
```

## Files to Create

### New Pages
| File | Description |
|------|-------------|
| `src/pages/EmployeePortal.tsx` | Main portal page with tabs |

### New Components
| File | Description |
|------|-------------|
| `src/components/portal/PortalDashboard.tsx` | Overview/welcome section |
| `src/components/portal/PortalAttendance.tsx` | Attendance tab content |
| `src/components/portal/PortalLeave.tsx` | Leave management tab |
| `src/components/portal/LeaveRequestDialog.tsx` | Apply for leave modal |
| `src/components/portal/PortalPayslips.tsx` | Payslip listing & viewer |
| `src/components/portal/PayslipDetailDialog.tsx` | Detailed payslip view |
| `src/components/portal/PortalHolidays.tsx` | Holidays list & calendar |

### New Hooks
| File | Description |
|------|-------------|
| `src/hooks/useMyEmployee.ts` | Get current user's employee record |
| `src/hooks/useMyPayslips.ts` | Get current employee's payslips |
| `src/hooks/useCompanyHolidays.ts` | Manage company holidays |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/portal` route |
| `src/components/layout/AppSidebar.tsx` | Add "My Portal" link for employees, hide admin features |
| `src/hooks/useUserRoles.ts` | Add helper to detect if user is an employee |

## Implementation Details

### Employee Detection Logic
```text
An employee can access the portal if:
1. They have the 'employee' role in user_roles table
   OR
2. Their user_id exists in the employees table with is_active = true
```

### Portal Navigation
```text
Employee role sees:
- My Portal (default route)
- Settings

Admin/Owner roles see:
- Full navigation (Dashboard, Transactions, etc.)
- My Portal (if they're also linked as an employee)
```

### Leave Request Flow
```text
1. Employee selects leave type
2. Picks start and end dates
3. Enters reason (optional for some types)
4. System validates:
   - Sufficient balance
   - No overlapping requests
5. Creates pending request
6. Admin receives notification (future)
7. Admin approves/rejects
8. If approved: attendance records auto-created (already implemented)
```

### Payslip Access Flow
```text
1. Employee opens Payslips tab
2. Hook queries employee_payslips WHERE employee_id matches
3. RLS policy validates user_id matches via employees table
4. Display list of payslips sorted by month
5. Click to view detailed breakdown
```

## User Interface Layout

### Portal Dashboard Tab
```text
+------------------------------------------+
| Welcome, [Employee Name]!                 |
| Today is Monday, January 27, 2026         |
+------------------------------------------+
|                                          |
| +----------------+  +------------------+ |
| | Today's Status |  | Quick Stats      | |
| | [Check In]     |  | Home Leave: 12   | |
| | Not checked in |  | Sick Leave: 8    | |
| +----------------+  +------------------+ |
|                                          |
| +--------------------------------------+ |
| | Upcoming Holidays                    | |
| | - Basant Panchami (Jan 29)           | |
| | - Maha Shivaratri (Feb 26)           | |
| +--------------------------------------+ |
+------------------------------------------+
```

### Leave Tab
```text
+------------------------------------------+
| Leave Balances           [Apply Leave]   |
+------------------------------------------+
| Home Leave  ████████░░ 12/18 available   |
| Sick Leave  ██████░░░░ 8/12 available    |
| ...                                      |
+------------------------------------------+
| My Leave Requests                        |
+------------------------------------------+
| | Type | Dates | Days | Status |        |
| | Home | Jan 10-12 | 3 | Approved |     |
| | Sick | Jan 5 | 1 | Pending |          |
+------------------------------------------+
```

### Payslips Tab
```text
+------------------------------------------+
| My Payslips                              |
+------------------------------------------+
| | Month | Gross | Deductions | Net |    |
| | Jan 2026 | ₹45,000 | ₹8,500 | ₹36,500 |
| | Dec 2025 | ₹45,000 | ₹8,500 | ₹36,500 |
| ...                                      |
+------------------------------------------+
```

## Security Considerations

1. **RLS Enforcement**: All database access is protected by RLS policies
2. **Employee Verification**: Portal only accessible if user has employee record
3. **Data Isolation**: Employees can only see their own data
4. **Leave Validation**: Server-side validation of leave balance before approval
5. **Payslip Protection**: Payslips only visible to the employee or company admins

## Implementation Order

1. **Database Migration**
   - Create `company_holidays` table
   - Add RLS policy for employee payslip access

2. **Hooks**
   - `useMyEmployee` - Get current user's employee record
   - `useMyPayslips` - Get employee's payslips
   - `useCompanyHolidays` - Holidays management

3. **Portal Page & Components**
   - Main `EmployeePortal.tsx` page
   - Dashboard, Attendance, Leave, Payslips, Holidays tabs

4. **Navigation Updates**
   - Add portal route to App.tsx
   - Update sidebar for role-based visibility

5. **Leave Request Dialog**
   - Form with validation
   - Integration with existing leave hooks

---

## Technical Notes

### Holiday Data Structure
Holidays are stored per-company to allow different organizations to have different holiday calendars. This is important for multi-tenant support.

### Payslip RLS Strategy
Rather than modifying the existing admin-focused policy, we add a new policy specifically for employee self-access. This follows the additive nature of Postgres RLS policies.

### Mobile Considerations
The portal should be mobile-friendly since employees may check in from phones. The check-in buttons should be prominent and easy to tap.
