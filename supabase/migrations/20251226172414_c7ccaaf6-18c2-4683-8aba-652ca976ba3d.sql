-- Bank accounts table
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  account_number text,
  bank_name text,
  account_type text DEFAULT 'checking',
  currency text DEFAULT 'USD',
  current_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_accounts
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON public.bank_accounts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON public.bank_accounts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts" ON public.bank_accounts
FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on bank_accounts
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Bank statements table (imported statement entries)
CREATE TABLE public.bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE CASCADE,
  statement_date date NOT NULL,
  reference_number text,
  description text,
  amount numeric NOT NULL,
  running_balance numeric,
  transaction_type text,
  is_matched boolean DEFAULT false,
  matched_transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on bank_statements
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_statements
CREATE POLICY "Users can view own bank statements" ON public.bank_statements
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank statements" ON public.bank_statements
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank statements" ON public.bank_statements
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank statements" ON public.bank_statements
FOR DELETE USING (auth.uid() = user_id);

-- Reconciliation sessions table
CREATE TABLE public.reconciliation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank_account_id uuid REFERENCES bank_accounts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  opening_balance numeric NOT NULL,
  closing_balance numeric NOT NULL,
  status text DEFAULT 'in_progress',
  matched_count integer DEFAULT 0,
  unmatched_count integer DEFAULT 0,
  difference numeric DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on reconciliation_sessions
ALTER TABLE public.reconciliation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reconciliation_sessions
CREATE POLICY "Users can view own reconciliation sessions" ON public.reconciliation_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reconciliation sessions" ON public.reconciliation_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reconciliation sessions" ON public.reconciliation_sessions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reconciliation sessions" ON public.reconciliation_sessions
FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on reconciliation_sessions
CREATE TRIGGER update_reconciliation_sessions_updated_at
  BEFORE UPDATE ON public.reconciliation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add reconciliation fields to transactions table
ALTER TABLE public.transactions ADD COLUMN is_reconciled boolean DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN reconciled_at timestamptz;
ALTER TABLE public.transactions ADD COLUMN bank_statement_id uuid REFERENCES bank_statements(id) ON DELETE SET NULL;