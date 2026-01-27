
# Plan: Employee Attendance Tracking with Check-in/Check-out

## Overview
Implement a comprehensive attendance tracking system that allows employees to check-in and check-out daily, automatically calculates working hours, integrates with the leave management system, and feeds into payroll processing with accurate present/absent/leave days.

## System Architecture

```text
+-------------------+     +--------------------+     +------------------+
|   Attendance UI   |---->|  Attendance Hook   |---->|  attendance_logs |
| (Check-in/out)    |     |  useAttendance.ts  |     |  (Database)      |
+-------------------+     +--------------------+     +------------------+
        |                          |                         |
        v                          v                         v
+-------------------+     +--------------------+     +------------------+
| Employee Profile  |     | Leave Integration  |     | Payroll Hook     |
| (Attendance Tab)  |     | (Auto-detect)      |     | (Working days)   |
+-------------------+     +--------------------+     +------------------+
```

## Feature Summary

| Feature | Description |
|---------|-------------|
| Daily Check-in | Record check-in time with optional notes |
| Daily Check-out | Record check-out time with optional notes |
| Working Hours | Auto-calculate hours from check-in/out times |
| Overtime Detection | Flag when daily hours exceed 8 hours |
| Monthly Summary | Present days, absent days, leave days, overtime |
| Payroll Integration | Use actual attendance data for payroll |
| Admin Management | Edit/add attendance records for employees |

## Database Schema

### New Table: `attendance_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| employee_id | uuid | Foreign key to employees |
| date | date | Attendance date (unique per employee) |
| check_in | timestamptz | Check-in timestamp |
| check_out | timestamptz | Check-out timestamp |
| working_hours | decimal | Calculated hours (auto or manual) |
| overtime_hours | decimal | Hours beyond 8 hrs |
| status | text | present, absent, leave, half_day, holiday |
| leave_request_id | uuid | Link to leave request if on leave |
| notes | text | Optional notes |
| created_by | uuid | Who created the record |
| created_at | timestamptz | Created timestamp |
| updated_at | timestamptz | Updated timestamp |

### Constraints
- Unique constraint on (employee_id, date)
- Status check: `'present', 'absent', 'leave', 'half_day', 'holiday', 'weekend'`

### RLS Policies
- Employees can view and insert their own attendance
- Company admins can view/edit all employee attendance
- Uses existing `has_company_access` function

## Changes Summary

### 1. Database Migration
Create `attendance_logs` table with proper constraints and RLS policies:

```sql
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  working_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present',
  leave_request_id UUID REFERENCES public.employee_leave_requests(id),
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date),
  CHECK (status IN ('present', 'absent', 'leave', 'half_day', 'holiday', 'weekend'))
);
```

### 2. New Hook: `useAttendance.ts`
Location: `src/hooks/useAttendance.ts`

Functions to implement:
- `checkIn(employeeId, notes?)` - Record check-in time
- `checkOut(employeeId, notes?)` - Record check-out and calculate hours
- `getTodayAttendance(employeeId)` - Get today's record
- `getMonthlyAttendance(employeeId, month, year)` - Monthly records
- `getMonthlyStats(employeeId, month, year)` - Summary statistics
- `createAttendanceRecord(data)` - Admin: manually add records
- `updateAttendanceRecord(id, data)` - Admin: edit records
- `markAsAbsent(employeeId, date)` - Mark absent for a day
- `syncLeaveAttendance(employeeId, startDate, endDate)` - Mark leave days

### 3. New Component: `AttendancePanel.tsx`
Location: `src/components/employees/AttendancePanel.tsx`

Features:
- Check-in button (shows check-in time if already checked in)
- Check-out button (disabled until checked in)
- Today's summary card
- Monthly calendar view with color-coded days
- Monthly statistics summary

UI Layout:
```text
+----------------------------------------+
| Today's Attendance          [Jan 27]   |
+----------------------------------------+
| Status: Not Checked In                 |
|                                        |
| [Check In]        [Check Out]          |
|                   (disabled)           |
+----------------------------------------+
| Working Hours: --                      |
| Notes: [optional input]                |
+----------------------------------------+

+----------------------------------------+
| Monthly Summary - January 2026         |
+----------------------------------------+
| Present: 18 days | Absent: 2 days      |
| Leave: 3 days    | Holidays: 3 days    |
| Total Hours: 144 | Overtime: 8 hrs     |
+----------------------------------------+
```

### 4. New Component: `AttendanceCalendar.tsx`
Location: `src/components/employees/AttendanceCalendar.tsx`

- Monthly calendar grid
- Color coding: Green (present), Red (absent), Blue (leave), Gray (holiday/weekend)
- Click to view/edit attendance for a day
- Shows working hours in each cell

### 5. New Component: `AttendanceManagement.tsx`
Location: `src/components/employees/AttendanceManagement.tsx`

Admin features:
- View all employee attendance for a date range
- Bulk mark attendance (absent/present/holiday)
- Export attendance reports
- Edit individual records

### 6. Update: `EmployeeProfile.tsx`
Add new "Attendance" tab with:
- Today's check-in/out buttons (for self-service)
- Monthly attendance calendar
- Monthly statistics

### 7. Update: `Employees.tsx` Page
Add new tab for Attendance Management:
- "Attendance" tab with company-wide attendance view
- Date picker to select date
- Table showing all employees with today's status
- Quick actions for check-in/out on behalf of employees

### 8. Update: `usePayroll.ts`
Integrate attendance data:
- Calculate actual `working_days` from attendance
- Calculate actual `present_days` from attendance
- Calculate `leave_days` from approved leave requests
- Sum `overtime_hours` from attendance logs

### 9. Leave Integration
When a leave request is approved:
- Auto-create attendance records for leave dates
- Set status to 'leave'
- Link to leave_request_id

---

## Implementation Details

### Attendance Status Types
```text
| Status   | Description                                |
|----------|-------------------------------------------|
| present  | Employee worked (check-in/out recorded)    |
| absent   | Employee did not work (no leave/holiday)   |
| leave    | On approved leave                          |
| half_day | Worked partial day                         |
| holiday  | Public holiday                             |
| weekend  | Saturday/Sunday (if applicable)            |
```

### Working Hours Calculation
```text
calculateWorkingHours(checkIn, checkOut):
  1. Parse timestamps to hours
  2. Subtract lunch break (1 hour for > 6 hrs work)
  3. Calculate total hours
  4. If hours > 8: overtime = hours - 8
  5. Return { workingHours, overtimeHours }
```

### Monthly Statistics
```text
getMonthlyStats(records):
  - presentDays: count where status = 'present' or 'half_day'
  - absentDays: count where status = 'absent'
  - leaveDays: count where status = 'leave'
  - holidays: count where status = 'holiday' or 'weekend'
  - totalWorkingHours: sum of working_hours
  - totalOvertimeHours: sum of overtime_hours
```

---

## Files to Create/Modify

### New Files
1. `supabase/migrations/xxx_create_attendance_logs.sql` - Database table
2. `src/hooks/useAttendance.ts` - Attendance data management hook
3. `src/components/employees/AttendancePanel.tsx` - Check-in/out UI
4. `src/components/employees/AttendanceCalendar.tsx` - Monthly calendar view
5. `src/components/employees/AttendanceManagement.tsx` - Admin attendance management
6. `src/components/employees/AttendanceDialog.tsx` - Edit attendance record dialog

### Modified Files
1. `src/pages/Employees.tsx` - Add Attendance tab
2. `src/components/employees/EmployeeProfile.tsx` - Add Attendance tab
3. `src/hooks/usePayroll.ts` - Use attendance data for payroll
4. `src/hooks/useEmployeeLeaves.ts` - Auto-create attendance on leave approval

---

## User Experience Flow

### Employee Self-Service
1. Employee opens Employee Profile or dedicated Attendance section
2. Clicks "Check In" at start of work
3. System records timestamp
4. At end of day, clicks "Check Out"
5. System calculates and displays working hours
6. Employee can view monthly summary and history

### Admin/Manager Flow
1. Navigate to Employees > Attendance tab
2. View all employees' attendance for selected date
3. Can mark absent/present for employees who forgot
4. View monthly reports per employee
5. Edit historical records if needed
6. Process payroll using accurate attendance data

### Leave Integration Flow
1. Employee submits leave request
2. Manager approves leave
3. System automatically creates attendance records
4. Status set to 'leave', linked to leave request
5. Payroll correctly reflects leave days

---

## Nepal Labour Act Compliance

| Requirement | Implementation |
|-------------|----------------|
| 8 hours/day standard | Working hours tracked, overtime flagged |
| 48 hours/week limit | Weekly summary available |
| Overtime at 1.5x | Overtime hours calculated for payroll |
| Leave integration | Approved leaves auto-marked in attendance |
| 13 public holidays | Admin can mark company-wide holidays |
