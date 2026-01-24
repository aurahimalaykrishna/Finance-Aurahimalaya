-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Identity
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  citizenship_number TEXT NOT NULL,
  citizenship_document_url TEXT,
  pan_number TEXT,
  marital_status TEXT NOT NULL DEFAULT 'single' CHECK (marital_status IN ('single', 'married')),
  
  -- Employment Details
  employee_code TEXT,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('regular', 'work_based', 'time_bound', 'casual', 'part_time')),
  date_of_join DATE NOT NULL,
  probation_end_date DATE,
  department TEXT,
  designation TEXT,
  
  -- Financials
  ssf_number TEXT,
  basic_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  dearness_allowance DECIMAL(15,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  termination_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create employee leave balances table
CREATE TABLE public.employee_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  fiscal_year TEXT NOT NULL,
  
  home_leave_accrued DECIMAL(5,2) DEFAULT 0,
  home_leave_used DECIMAL(5,2) DEFAULT 0,
  sick_leave_accrued DECIMAL(5,2) DEFAULT 0,
  sick_leave_used DECIMAL(5,2) DEFAULT 0,
  maternity_leave_used INTEGER DEFAULT 0,
  paternity_leave_used INTEGER DEFAULT 0,
  mourning_leave_used INTEGER DEFAULT 0,
  public_holidays_used INTEGER DEFAULT 0,
  
  home_leave_carried_forward DECIMAL(5,2) DEFAULT 0,
  sick_leave_carried_forward DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(employee_id, fiscal_year)
);

-- Create employee leave requests table
CREATE TABLE public.employee_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('home', 'sick', 'maternity', 'paternity', 'mourning', 'public_holiday')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested DECIMAL(5,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payroll runs table
CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  fiscal_year TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'finalized')),
  processed_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, fiscal_year, month)
);

-- Create employee payslips table
CREATE TABLE public.employee_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  basic_salary DECIMAL(15,2) NOT NULL,
  dearness_allowance DECIMAL(15,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  overtime_amount DECIMAL(15,2) DEFAULT 0,
  festival_allowance DECIMAL(15,2) DEFAULT 0,
  other_allowances DECIMAL(15,2) DEFAULT 0,
  gross_salary DECIMAL(15,2) NOT NULL,
  
  ssf_employee_contribution DECIMAL(15,2) DEFAULT 0,
  ssf_employer_contribution DECIMAL(15,2) DEFAULT 0,
  income_tax DECIMAL(15,2) DEFAULT 0,
  social_security_tax DECIMAL(15,2) DEFAULT 0,
  other_deductions DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) NOT NULL,
  
  net_salary DECIMAL(15,2) NOT NULL,
  
  working_days INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  leave_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tax slabs table
CREATE TABLE public.tax_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year TEXT NOT NULL,
  marital_status TEXT NOT NULL CHECK (marital_status IN ('single', 'married')),
  min_amount DECIMAL(15,2) NOT NULL,
  max_amount DECIMAL(15,2),
  tax_rate DECIMAL(5,4) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_slabs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Users can view company employees"
ON public.employees FOR SELECT
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can insert company employees"
ON public.employees FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can update company employees"
ON public.employees FOR UPDATE
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can delete company employees"
ON public.employees FOR DELETE
USING (has_company_access(auth.uid(), company_id));

-- RLS Policies for employee_leave_balances
CREATE POLICY "Users can view employee leave balances"
ON public.employee_leave_balances FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_leave_balances.employee_id
  AND has_company_access(auth.uid(), e.company_id)
));

CREATE POLICY "Users can insert employee leave balances"
ON public.employee_leave_balances FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_leave_balances.employee_id
  AND has_company_access(auth.uid(), e.company_id)
));

CREATE POLICY "Users can update employee leave balances"
ON public.employee_leave_balances FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_leave_balances.employee_id
  AND has_company_access(auth.uid(), e.company_id)
));

CREATE POLICY "Users can delete employee leave balances"
ON public.employee_leave_balances FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_leave_balances.employee_id
  AND has_company_access(auth.uid(), e.company_id)
));

-- RLS Policies for employee_leave_requests
CREATE POLICY "Users can view employee leave requests"
ON public.employee_leave_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_leave_requests.employee_id
  AND has_company_access(auth.uid(), e.company_id)
));

CREATE POLICY "Users can insert employee leave requests"
ON public.employee_leave_requests FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_leave_requests.employee_id
  AND has_company_access(auth.uid(), e.company_id)
));

CREATE POLICY "Users can update employee leave requests"
ON public.employee_leave_requests FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_leave_requests.employee_id
  AND has_company_access(auth.uid(), e.company_id)
));

CREATE POLICY "Users can delete employee leave requests"
ON public.employee_leave_requests FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_leave_requests.employee_id
  AND has_company_access(auth.uid(), e.company_id)
));

-- RLS Policies for payroll_runs
CREATE POLICY "Users can view company payroll runs"
ON public.payroll_runs FOR SELECT
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can insert company payroll runs"
ON public.payroll_runs FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can update company payroll runs"
ON public.payroll_runs FOR UPDATE
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can delete company payroll runs"
ON public.payroll_runs FOR DELETE
USING (has_company_access(auth.uid(), company_id));

-- RLS Policies for employee_payslips
CREATE POLICY "Users can view employee payslips"
ON public.employee_payslips FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.payroll_runs pr
  WHERE pr.id = employee_payslips.payroll_run_id
  AND has_company_access(auth.uid(), pr.company_id)
));

CREATE POLICY "Users can insert employee payslips"
ON public.employee_payslips FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.payroll_runs pr
  WHERE pr.id = employee_payslips.payroll_run_id
  AND has_company_access(auth.uid(), pr.company_id)
));

CREATE POLICY "Users can update employee payslips"
ON public.employee_payslips FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.payroll_runs pr
  WHERE pr.id = employee_payslips.payroll_run_id
  AND has_company_access(auth.uid(), pr.company_id)
));

CREATE POLICY "Users can delete employee payslips"
ON public.employee_payslips FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.payroll_runs pr
  WHERE pr.id = employee_payslips.payroll_run_id
  AND has_company_access(auth.uid(), pr.company_id)
));

-- RLS Policies for tax_slabs (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view tax slabs"
ON public.tax_slabs FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert FY 2082/83 tax slabs for Nepal
INSERT INTO public.tax_slabs (fiscal_year, marital_status, min_amount, max_amount, tax_rate) VALUES
-- Single tax slabs
('2082/83', 'single', 0, 500000, 0.01),
('2082/83', 'single', 500001, 700000, 0.10),
('2082/83', 'single', 700001, 1000000, 0.20),
('2082/83', 'single', 1000001, 2000000, 0.30),
('2082/83', 'single', 2000001, NULL, 0.36),
-- Married tax slabs
('2082/83', 'married', 0, 600000, 0.01),
('2082/83', 'married', 600001, 800000, 0.10),
('2082/83', 'married', 800001, 1100000, 0.20),
('2082/83', 'married', 1100001, 2000000, 0.30),
('2082/83', 'married', 2000001, NULL, 0.36);

-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false);

-- Storage policies for employee documents
CREATE POLICY "Users can upload employee documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view employee documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update employee documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'employee-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete employee documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'employee-documents' AND
  auth.uid() IS NOT NULL
);

-- Trigger for updated_at on employees
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on employee_leave_balances
CREATE TRIGGER update_employee_leave_balances_updated_at
BEFORE UPDATE ON public.employee_leave_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();