-- Add 'employee' to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'employee';

-- Drop existing restrictive policies on employee_leave_requests to replace with more permissive ones
DROP POLICY IF EXISTS "Users can view employee leave requests" ON public.employee_leave_requests;
DROP POLICY IF EXISTS "Users can insert employee leave requests" ON public.employee_leave_requests;

-- Allow employees to view their own leave requests OR managers with company access
CREATE POLICY "Users and employees can view leave requests"
ON public.employee_leave_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_leave_requests.employee_id 
    AND (e.user_id = auth.uid() OR has_company_access(auth.uid(), e.company_id))
  )
);

-- Allow employees to create their own leave requests
CREATE POLICY "Employees can insert own leave requests"
ON public.employee_leave_requests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_leave_requests.employee_id 
    AND e.user_id = auth.uid()
  )
);

-- Drop existing restrictive policies on employee_leave_balances to add self-view
DROP POLICY IF EXISTS "Users can view employee leave balances" ON public.employee_leave_balances;

-- Allow employees to view their own leave balance OR managers with company access
CREATE POLICY "Users and employees can view leave balances"
ON public.employee_leave_balances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_leave_balances.employee_id 
    AND (e.user_id = auth.uid() OR has_company_access(auth.uid(), e.company_id))
  )
);

-- Drop existing restrictive policies on employees to add self-view
DROP POLICY IF EXISTS "Users can view company employees" ON public.employees;

-- Allow employees to view their own record OR managers with company access
CREATE POLICY "Users and employees can view employee records"
ON public.employees FOR SELECT
USING (
  user_id = auth.uid() OR has_company_access(auth.uid(), company_id)
);