-- Add estimated_tasks_per_month column for task-based employees
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS estimated_tasks_per_month integer DEFAULT 0;