-- Create leave types table
CREATE TABLE public.company_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  annual_entitlement DECIMAL(5,2) NOT NULL DEFAULT 0,
  max_accrual DECIMAL(5,2),
  max_carry_forward DECIMAL(5,2) DEFAULT 0,
  accrual_type TEXT NOT NULL DEFAULT 'annual',
  accrual_rate DECIMAL(5,2),
  accrual_per_days INTEGER,
  gender_restriction TEXT,
  is_paid BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'calendar',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Enable RLS
ALTER TABLE public.company_leave_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company leave types"
ON public.company_leave_types FOR SELECT
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "HR can insert company leave types"
ON public.company_leave_types FOR INSERT
WITH CHECK (
  has_company_access(auth.uid(), company_id) AND 
  has_any_role(auth.uid(), ARRAY['owner', 'admin', 'hr_manager']::app_role[])
);

CREATE POLICY "HR can update company leave types"
ON public.company_leave_types FOR UPDATE
USING (
  has_company_access(auth.uid(), company_id) AND 
  has_any_role(auth.uid(), ARRAY['owner', 'admin', 'hr_manager']::app_role[])
);

CREATE POLICY "HR can delete company leave types"
ON public.company_leave_types FOR DELETE
USING (
  has_company_access(auth.uid(), company_id) AND 
  has_any_role(auth.uid(), ARRAY['owner', 'admin', 'hr_manager']::app_role[])
);

-- Trigger for updated_at
CREATE TRIGGER update_company_leave_types_updated_at
  BEFORE UPDATE ON public.company_leave_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();