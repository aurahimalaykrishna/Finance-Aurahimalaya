
-- Create helper function to check if user has access to a company
CREATE OR REPLACE FUNCTION public.has_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User owns the company
    SELECT 1 FROM public.companies WHERE id = _company_id AND user_id = _user_id
    UNION
    -- User has been granted access
    SELECT 1 FROM public.company_access WHERE company_id = _company_id AND user_id = _user_id
  )
$$;

-- Update transactions RLS policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view company transactions" ON public.transactions
FOR SELECT USING (
  public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can insert company transactions" ON public.transactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can update company transactions" ON public.transactions
FOR UPDATE USING (
  public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can delete company transactions" ON public.transactions
FOR DELETE USING (
  public.has_company_access(auth.uid(), company_id)
);

-- Update bank_accounts RLS policies
DROP POLICY IF EXISTS "Users can view own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can insert own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can update own bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can delete own bank accounts" ON public.bank_accounts;

CREATE POLICY "Users can view company bank accounts" ON public.bank_accounts
FOR SELECT USING (
  public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can insert company bank accounts" ON public.bank_accounts
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can update company bank accounts" ON public.bank_accounts
FOR UPDATE USING (
  public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can delete company bank accounts" ON public.bank_accounts
FOR DELETE USING (
  public.has_company_access(auth.uid(), company_id)
);

-- Update bank_statements RLS policies (via bank_account relationship)
DROP POLICY IF EXISTS "Users can view own bank statements" ON public.bank_statements;
DROP POLICY IF EXISTS "Users can insert own bank statements" ON public.bank_statements;
DROP POLICY IF EXISTS "Users can update own bank statements" ON public.bank_statements;
DROP POLICY IF EXISTS "Users can delete own bank statements" ON public.bank_statements;

CREATE POLICY "Users can view company bank statements" ON public.bank_statements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba 
    WHERE ba.id = bank_account_id 
    AND public.has_company_access(auth.uid(), ba.company_id)
  )
);

CREATE POLICY "Users can insert company bank statements" ON public.bank_statements
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.bank_accounts ba 
    WHERE ba.id = bank_account_id 
    AND public.has_company_access(auth.uid(), ba.company_id)
  )
);

CREATE POLICY "Users can update company bank statements" ON public.bank_statements
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba 
    WHERE ba.id = bank_account_id 
    AND public.has_company_access(auth.uid(), ba.company_id)
  )
);

CREATE POLICY "Users can delete company bank statements" ON public.bank_statements
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.bank_accounts ba 
    WHERE ba.id = bank_account_id 
    AND public.has_company_access(auth.uid(), ba.company_id)
  )
);

-- Update categories RLS policies
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Users can view company categories" ON public.categories
FOR SELECT USING (
  public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can insert company categories" ON public.categories
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can update company categories" ON public.categories
FOR UPDATE USING (
  public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can delete company categories" ON public.categories
FOR DELETE USING (
  public.has_company_access(auth.uid(), company_id)
);

-- Update budgets RLS policies
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;

CREATE POLICY "Users can view company budgets" ON public.budgets
FOR SELECT USING (
  public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can insert company budgets" ON public.budgets
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can update company budgets" ON public.budgets
FOR UPDATE USING (
  public.has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users can delete company budgets" ON public.budgets
FOR DELETE USING (
  public.has_company_access(auth.uid(), company_id)
);
