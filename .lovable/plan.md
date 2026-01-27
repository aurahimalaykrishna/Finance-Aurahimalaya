

# Plan: Add Task-Based Employment Type with Financial Handling

## Overview
Add a new "Task-based" employment type for employees who are paid per task or project completion. This includes updating the database constraints, business logic, and UI to support task-based salary structure with per-task rate input.

## Employment Type to Salary Mapping (Updated)

| Employment Type | Salary Input | Calculation |
|-----------------|--------------|-------------|
| Regular | Monthly salary | Direct amount |
| Time-bound | Monthly salary | Direct amount |
| Work-based | Daily rate | Daily rate x 26 days = Monthly |
| Casual | Hourly rate | Hourly rate x 208 hours = Monthly |
| Part-time | Hourly rate | Hourly rate x 208 hours = Monthly |
| **Task-based** | **Per-task rate** | **Rate x estimated tasks/month** |

## Changes Summary

### 1. Database Changes
Update the `employees_employment_type_check` constraint to include 'task_based':

```sql
ALTER TABLE public.employees 
  DROP CONSTRAINT employees_employment_type_check;

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_employment_type_check 
  CHECK (employment_type = ANY (ARRAY[
    'regular', 'work_based', 'time_bound', 
    'casual', 'part_time', 'task_based'
  ]));

-- Add new salary type for task-based
ALTER TABLE public.employees 
  DROP CONSTRAINT employees_salary_type_check;

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_salary_type_check 
  CHECK (salary_type = ANY (ARRAY[
    'monthly', 'daily', 'hourly', 'per_task'
  ]));

-- Add column for estimated tasks per month
ALTER TABLE public.employees 
  ADD COLUMN estimated_tasks_per_month integer DEFAULT 0;
```

### 2. Business Logic Updates
Update `src/lib/nepal-hr-calculations.ts`:

- Add 'task_based' to `EMPLOYMENT_TYPES` constant
- Add 'per_task' to `SALARY_TYPES` constant
- Update `EmploymentType` to include 'task_based'
- Update `SalaryType` to include 'per_task'
- Add `task_based: 'per_task'` to `EMPLOYMENT_TO_SALARY_MAP`
- Add function `calculateMonthlyFromTask(taskRate, tasksPerMonth)`

### 3. Type Updates
Update `src/hooks/useEmployees.ts`:

- Add `estimated_tasks_per_month` to `Employee` and `CreateEmployeeData` interfaces
- Update mutations to handle task-based salary calculations

### 4. Employee Form Updates
Update `src/components/employees/EmployeeDialog.tsx`:

Financial tab changes for task-based employees:
- Show "Per-Task Rate (NPR)" input field
- Show "Estimated Tasks/Month" input field
- Display calculated monthly equivalent
- Show calculation breakdown

```text
Financial Tab Layout (Task-based):
+----------------------------------+
| Employment Type: [Task-based]    |
+----------------------------------+
| Salary Type: Per Task (auto)     |
+----------------------------------+
| Per-Task Rate (NPR) *            |
| [___________2000_________]       |
+----------------------------------+
| Estimated Tasks/Month *          |
| [___________10___________]       |
+----------------------------------+
| Monthly Equivalent               |
| NPR 20,000 (2000 x 10 tasks)    |
+----------------------------------+
| Dearness Allowance (NPR)         |
| [________________]               |
+----------------------------------+
```

### 5. Employee Profile Updates
Update `src/components/employees/EmployeeProfile.tsx`:

- Display "Per Task" salary type badge for task-based employees
- Show per-task rate (e.g., "NPR 2,000/task")
- Show estimated tasks and calculation breakdown
- Display monthly equivalent with formula

---

## Technical Details

### Database Migration SQL
```sql
-- Update employment_type constraint to include task_based
ALTER TABLE public.employees 
  DROP CONSTRAINT employees_employment_type_check;

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_employment_type_check 
  CHECK (employment_type = ANY (ARRAY[
    'regular'::text, 'work_based'::text, 'time_bound'::text, 
    'casual'::text, 'part_time'::text, 'task_based'::text
  ]));

-- Update salary_type constraint to include per_task
ALTER TABLE public.employees 
  DROP CONSTRAINT employees_salary_type_check;

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_salary_type_check 
  CHECK (salary_type = ANY (ARRAY[
    'monthly'::text, 'daily'::text, 'hourly'::text, 'per_task'::text
  ]));

-- Add estimated_tasks_per_month column
ALTER TABLE public.employees 
  ADD COLUMN estimated_tasks_per_month integer DEFAULT 0;
```

### Constants Update (nepal-hr-calculations.ts)
```text
EMPLOYMENT_TYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'work_based', label: 'Work-based' },
  { value: 'time_bound', label: 'Time-bound' },
  { value: 'casual', label: 'Casual' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'task_based', label: 'Task-based' },  // NEW
]

SALARY_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'per_task', label: 'Per Task' },  // NEW
]

EMPLOYMENT_TO_SALARY_MAP = {
  regular: 'monthly',
  time_bound: 'monthly',
  work_based: 'daily',
  casual: 'hourly',
  part_time: 'hourly',
  task_based: 'per_task',  // NEW
}
```

### Calculation Function
```text
calculateMonthlyFromTask(taskRate, tasksPerMonth):
  return taskRate * tasksPerMonth
```

---

## Files to Modify

1. **Database migration** - Add `task_based` to employment type, `per_task` to salary type, and add `estimated_tasks_per_month` column
2. `src/lib/nepal-hr-calculations.ts` - Add task-based constants and calculation helper
3. `src/hooks/useEmployees.ts` - Update interfaces and mutation logic for task-based
4. `src/components/employees/EmployeeDialog.tsx` - Add task-based salary input fields
5. `src/components/employees/EmployeeProfile.tsx` - Display task-based salary information

---

## User Experience

1. User selects "Task-based" employment type
2. Financial tab automatically shows:
   - "Per-Task Rate (NPR)" input
   - "Estimated Tasks/Month" input
3. User enters per-task rate (e.g., NPR 2,000) and estimated tasks (e.g., 10)
4. System displays calculated monthly equivalent (NPR 20,000)
5. Monthly equivalent is stored as `basic_salary` for payroll calculations
6. Original rate stored in `hourly_rate` field, tasks stored in `estimated_tasks_per_month`

