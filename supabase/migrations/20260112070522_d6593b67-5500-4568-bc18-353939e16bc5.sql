-- Create suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add supplier_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Users can view company suppliers"
ON public.suppliers
FOR SELECT
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can insert company suppliers"
ON public.suppliers
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can update company suppliers"
ON public.suppliers
FOR UPDATE
USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can delete company suppliers"
ON public.suppliers
FOR DELETE
USING (has_company_access(auth.uid(), company_id));

-- Create trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_suppliers_company_id ON public.suppliers(company_id);
CREATE INDEX idx_transactions_supplier_id ON public.transactions(supplier_id);