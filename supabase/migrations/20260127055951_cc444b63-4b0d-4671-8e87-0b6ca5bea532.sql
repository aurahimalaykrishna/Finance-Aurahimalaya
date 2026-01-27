-- Add salary_type and hourly_rate columns to employees table
ALTER TABLE public.employees 
  ADD COLUMN salary_type text NOT NULL DEFAULT 'monthly',
  ADD COLUMN hourly_rate numeric DEFAULT 0;

-- Add check constraint for valid salary types
ALTER TABLE public.employees 
  ADD CONSTRAINT employees_salary_type_check 
  CHECK (salary_type IN ('monthly', 'daily', 'hourly'));