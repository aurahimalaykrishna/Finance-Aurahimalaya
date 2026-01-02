-- Create junction table for many-to-many statement-transaction matches
CREATE TABLE public.statement_transaction_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_statement_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bank_statement_id, transaction_id)
);

-- Enable RLS
ALTER TABLE public.statement_transaction_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies using company access via bank account
CREATE POLICY "Users can view statement matches via company access"
  ON public.statement_transaction_matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bank_statements bs
    JOIN bank_accounts ba ON ba.id = bs.bank_account_id
    WHERE bs.id = bank_statement_id 
    AND has_company_access(auth.uid(), ba.company_id)
  ));

CREATE POLICY "Users can insert statement matches via company access"
  ON public.statement_transaction_matches FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM bank_statements bs
      JOIN bank_accounts ba ON ba.id = bs.bank_account_id
      WHERE bs.id = bank_statement_id 
      AND has_company_access(auth.uid(), ba.company_id)
    )
  );

CREATE POLICY "Users can delete statement matches via company access"
  ON public.statement_transaction_matches FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM bank_statements bs
    JOIN bank_accounts ba ON ba.id = bs.bank_account_id
    WHERE bs.id = bank_statement_id 
    AND has_company_access(auth.uid(), ba.company_id)
  ));