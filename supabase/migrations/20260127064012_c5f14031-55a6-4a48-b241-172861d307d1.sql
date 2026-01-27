-- Create attendance_logs table for daily check-in/check-out tracking
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

-- Enable RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_attendance_logs_employee_date ON public.attendance_logs(employee_id, date);
CREATE INDEX idx_attendance_logs_date ON public.attendance_logs(date);

-- RLS Policies

-- Employees can view their own attendance records
CREATE POLICY "Employees can view own attendance"
ON public.attendance_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance_logs.employee_id
    AND e.user_id = auth.uid()
  )
);

-- Company admins can view all attendance for their company
CREATE POLICY "Company admins can view attendance"
ON public.attendance_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance_logs.employee_id
    AND has_company_access(auth.uid(), e.company_id)
  )
);

-- Employees can insert their own attendance (check-in)
CREATE POLICY "Employees can insert own attendance"
ON public.attendance_logs
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance_logs.employee_id
    AND e.user_id = auth.uid()
  )
);

-- Company admins can insert attendance for any employee
CREATE POLICY "Company admins can insert attendance"
ON public.attendance_logs
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance_logs.employee_id
    AND has_company_access(auth.uid(), e.company_id)
  )
);

-- Employees can update their own attendance (check-out)
CREATE POLICY "Employees can update own attendance"
ON public.attendance_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance_logs.employee_id
    AND e.user_id = auth.uid()
  )
);

-- Company admins can update any attendance in their company
CREATE POLICY "Company admins can update attendance"
ON public.attendance_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance_logs.employee_id
    AND has_company_access(auth.uid(), e.company_id)
  )
);

-- Company admins can delete attendance records
CREATE POLICY "Company admins can delete attendance"
ON public.attendance_logs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance_logs.employee_id
    AND has_company_access(auth.uid(), e.company_id)
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_attendance_logs_updated_at
BEFORE UPDATE ON public.attendance_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();