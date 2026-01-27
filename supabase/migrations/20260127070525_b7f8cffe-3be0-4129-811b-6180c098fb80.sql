-- Create company_holidays table
CREATE TABLE public.company_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id, date)
);

-- Enable RLS
ALTER TABLE public.company_holidays ENABLE ROW LEVEL SECURITY;

-- RLS: Company members can view holidays
CREATE POLICY "Users can view company holidays"
ON public.company_holidays FOR SELECT
USING (has_company_access(auth.uid(), company_id));

-- RLS: Admins can insert holidays
CREATE POLICY "Admins can insert company holidays"
ON public.company_holidays FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND 
  has_company_access(auth.uid(), company_id) AND
  has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role])
);

-- RLS: Admins can update holidays
CREATE POLICY "Admins can update company holidays"
ON public.company_holidays FOR UPDATE
USING (
  has_company_access(auth.uid(), company_id) AND
  has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role])
);

-- RLS: Admins can delete holidays
CREATE POLICY "Admins can delete company holidays"
ON public.company_holidays FOR DELETE
USING (
  has_company_access(auth.uid(), company_id) AND
  has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role, 'accountant'::app_role])
);

-- Add RLS policy for employees to view their own payslips
CREATE POLICY "Employees can view own payslips"
ON public.employee_payslips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_payslips.employee_id 
    AND e.user_id = auth.uid()
  )
);