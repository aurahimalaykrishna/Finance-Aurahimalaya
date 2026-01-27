-- Update employment_type constraint to include task_based
ALTER TABLE public.employees 
  DROP CONSTRAINT IF EXISTS employees_employment_type_check;

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_employment_type_check 
  CHECK (employment_type = ANY (ARRAY[
    'regular'::text, 'work_based'::text, 'time_bound'::text, 
    'casual'::text, 'part_time'::text, 'task_based'::text
  ]));

-- Update salary_type constraint to include per_task
ALTER TABLE public.employees 
  DROP CONSTRAINT IF EXISTS employees_salary_type_check;

ALTER TABLE public.employees 
  ADD CONSTRAINT employees_salary_type_check 
  CHECK (salary_type = ANY (ARRAY[
    'monthly'::text, 'daily'::text, 'hourly'::text, 'per_task'::text
  ]));