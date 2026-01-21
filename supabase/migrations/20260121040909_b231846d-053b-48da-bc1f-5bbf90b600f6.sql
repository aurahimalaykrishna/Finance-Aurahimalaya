-- Create transaction_splits table for storing split allocations
CREATE TABLE public.transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  category_id UUID,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) 
    REFERENCES public.transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_category FOREIGN KEY (category_id) 
    REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Add is_split flag to transactions table
ALTER TABLE public.transactions ADD COLUMN is_split BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;

-- RLS policies: access via parent transaction's company
CREATE POLICY "Users can view splits via transaction company access"
ON public.transaction_splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_splits.transaction_id
    AND has_company_access(auth.uid(), t.company_id)
  )
);

CREATE POLICY "Users can insert splits via transaction company access"
ON public.transaction_splits FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_splits.transaction_id
    AND has_company_access(auth.uid(), t.company_id)
  )
);

CREATE POLICY "Users can update splits via transaction company access"
ON public.transaction_splits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_splits.transaction_id
    AND has_company_access(auth.uid(), t.company_id)
  )
);

CREATE POLICY "Users can delete splits via transaction company access"
ON public.transaction_splits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_splits.transaction_id
    AND has_company_access(auth.uid(), t.company_id)
  )
);

-- Create index for faster lookups
CREATE INDEX idx_transaction_splits_transaction_id ON public.transaction_splits(transaction_id);
CREATE INDEX idx_transaction_splits_category_id ON public.transaction_splits(category_id);