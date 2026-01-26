-- =============================================
-- Invoice Management System Tables
-- =============================================

-- 1. Create customers table (clients who receive invoices)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NPR',
  notes TEXT,
  terms TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_customers_company_id ON public.customers(company_id);
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for customers
-- =============================================
CREATE POLICY "Users can view company customers"
  ON public.customers FOR SELECT
  USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can insert company customers"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can update company customers"
  ON public.customers FOR UPDATE
  USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can delete company customers"
  ON public.customers FOR DELETE
  USING (has_company_access(auth.uid(), company_id));

-- =============================================
-- RLS Policies for invoices
-- =============================================
CREATE POLICY "Users can view company invoices"
  ON public.invoices FOR SELECT
  USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can insert company invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can update company invoices"
  ON public.invoices FOR UPDATE
  USING (has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can delete company invoices"
  ON public.invoices FOR DELETE
  USING (has_company_access(auth.uid(), company_id));

-- =============================================
-- RLS Policies for invoice_items
-- =============================================
CREATE POLICY "Users can view invoice items via invoice company access"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
    AND has_company_access(auth.uid(), i.company_id)
  ));

CREATE POLICY "Users can insert invoice items via invoice company access"
  ON public.invoice_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
    AND has_company_access(auth.uid(), i.company_id)
  ));

CREATE POLICY "Users can update invoice items via invoice company access"
  ON public.invoice_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
    AND has_company_access(auth.uid(), i.company_id)
  ));

CREATE POLICY "Users can delete invoice items via invoice company access"
  ON public.invoice_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
    AND has_company_access(auth.uid(), i.company_id)
  ));

-- =============================================
-- Function to generate invoice numbers
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ '^INV-[0-9]+$' 
      THEN CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)
      ELSE 0 
    END
  ), 0) + 1 INTO next_num
  FROM invoices 
  WHERE company_id = p_company_id;
  
  RETURN 'INV-' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();