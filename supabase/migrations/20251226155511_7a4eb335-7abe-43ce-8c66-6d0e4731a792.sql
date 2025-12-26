-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  currency text DEFAULT 'USD',
  fiscal_year_start integer DEFAULT 1,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies
CREATE POLICY "Users can view own companies"
ON public.companies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
ON public.companies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
ON public.companies FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add company_id to transactions
ALTER TABLE public.transactions ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Add company_id to categories
ALTER TABLE public.categories ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Add company_id to budgets
ALTER TABLE public.budgets ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Function to create default company for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Create a default company for the new user
  INSERT INTO public.companies (user_id, name, is_default)
  VALUES (NEW.id, 'My Business', true)
  RETURNING id INTO new_company_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to create default company when user signs up
CREATE TRIGGER on_auth_user_created_company
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_company();

-- Migrate existing users: create default companies and assign data
DO $$
DECLARE
  user_record RECORD;
  new_company_id uuid;
BEGIN
  -- For each existing user without a company
  FOR user_record IN 
    SELECT DISTINCT p.id as user_id 
    FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.user_id = p.id)
  LOOP
    -- Create a default company
    INSERT INTO public.companies (user_id, name, is_default)
    VALUES (user_record.user_id, 'My Business', true)
    RETURNING id INTO new_company_id;
    
    -- Assign existing transactions to this company
    UPDATE public.transactions 
    SET company_id = new_company_id 
    WHERE user_id = user_record.user_id AND company_id IS NULL;
    
    -- Assign existing categories to this company
    UPDATE public.categories 
    SET company_id = new_company_id 
    WHERE user_id = user_record.user_id AND company_id IS NULL;
    
    -- Assign existing budgets to this company
    UPDATE public.budgets 
    SET company_id = new_company_id 
    WHERE user_id = user_record.user_id AND company_id IS NULL;
  END LOOP;
END;
$$;