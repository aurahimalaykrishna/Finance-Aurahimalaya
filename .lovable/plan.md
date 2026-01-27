
# Plan: Employment Type-Based Salary Structure

## Overview
Automatically set the salary input type based on the selected employment type in the Financial section. Each employment type will have its appropriate salary structure, with automatic calculation of monthly equivalent for display and payroll calculations.

## Employment Type to Salary Mapping

| Employment Type | Salary Input | Calculation |
|-----------------|--------------|-------------|
| Regular | Monthly salary | Direct amount |
| Time-bound | Monthly salary | Direct amount |
| Work-based | Daily rate | Daily rate x 26 days = Monthly |
| Casual | Hourly rate | Hourly rate x 208 hours = Monthly |
| Part-time | Hourly rate | Hourly rate x 208 hours = Monthly |

## Changes Summary

### 1. Database Changes
Add two new columns to the `employees` table:
- `salary_type`: Text field ('monthly', 'daily', 'hourly') - auto-determined by employment type
- `hourly_rate`: Numeric field for hourly/daily rate storage

### 2. Business Logic Updates
Add to `src/lib/nepal-hr-calculations.ts`:
- Salary type constants
- Mapping function from employment type to salary type
- Monthly equivalent calculation function

### 3. Employee Form Updates
Update `src/components/employees/EmployeeDialog.tsx`:
- Auto-set salary type when employment type changes
- Show appropriate input field based on salary type:
  - Monthly: Basic Salary input
  - Daily: Daily Rate input + calculated monthly display
  - Hourly: Hourly Rate input + calculated monthly display
- Calculate and store basic_salary as monthly equivalent

### 4. Employee Profile Updates
Update `src/components/employees/EmployeeProfile.tsx`:
- Display salary type badge
- Show rate breakdown (e.g., "NPR 500/day x 26 = NPR 13,000/month")
- Show original rate alongside monthly equivalent

### 5. Type Updates
Update `src/hooks/useEmployees.ts`:
- Add `salary_type` and `hourly_rate` to interfaces
- Handle salary type setting in create/update mutations

---

## Technical Details

### Database Migration
```sql
ALTER TABLE public.employees 
  ADD COLUMN salary_type text NOT NULL DEFAULT 'monthly',
  ADD COLUMN hourly_rate numeric DEFAULT 0;

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_salary_type_check 
  CHECK (salary_type IN ('monthly', 'daily', 'hourly'));
```

### Salary Type Constants (nepal-hr-calculations.ts)
```text
SALARY_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' }
]

EMPLOYMENT_TO_SALARY_MAP = {
  regular: 'monthly',
  time_bound: 'monthly',
  work_based: 'daily',
  casual: 'hourly',
  part_time: 'hourly'
}
```

### Calculation Functions
```text
calculateMonthlyFromDaily(dailyRate) = dailyRate * 26
calculateMonthlyFromHourly(hourlyRate) = hourlyRate * 208
```

### Form UI Changes
```text
Financial Tab Layout:
+----------------------------------+
| Employment Type: [Work-based]    |  <-- From Employment tab
+----------------------------------+
| Salary Type: Daily Rate (auto)   |  <-- Read-only indicator
+----------------------------------+
| Daily Rate (NPR) *               |
| [___________500__________]       |
+----------------------------------+
| Monthly Equivalent               |
| NPR 13,000 (500 x 26 days)      |  <-- Calculated display
+----------------------------------+
| Dearness Allowance (NPR)         |
| [________________]               |
+----------------------------------+
| SSF Number                       |
| [________________]               |
+----------------------------------+
```

### Profile Display Changes
```text
Financial Tab:
+---------------------+----------------------+
| Salary Type         | Daily Rate           |
| [Daily]             | NPR 500/day          |
+---------------------+----------------------+
| Monthly Equivalent  | Calculation          |
| NPR 13,000          | 500 x 26 days        |
+---------------------+----------------------+
```

## Files to Modify

1. **Database migration** - Add `salary_type` and `hourly_rate` columns
2. `src/lib/nepal-hr-calculations.ts` - Add salary type constants and calculation helpers
3. `src/hooks/useEmployees.ts` - Update interfaces and mutation logic
4. `src/components/employees/EmployeeDialog.tsx` - Dynamic salary input based on employment type
5. `src/components/employees/EmployeeProfile.tsx` - Display salary type and rate breakdown

## User Experience

1. User selects employment type (e.g., "Work-based")
2. Financial tab automatically shows "Daily Rate" input instead of "Basic Salary"
3. User enters daily rate (e.g., NPR 500)
4. System displays calculated monthly equivalent (NPR 13,000)
5. Monthly equivalent is stored as `basic_salary` for payroll calculations
6. Original rate stored in `hourly_rate` for reference
