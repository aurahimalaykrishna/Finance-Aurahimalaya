-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;

-- Create new SELECT policy that allows viewing owned companies OR companies with access
CREATE POLICY "Users can view accessible companies"
ON public.companies
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (
    SELECT ca.user_id 
    FROM public.company_access ca 
    WHERE ca.company_id = id
  )
);

-- Create function to get all companies a user can access
CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  currency text,
  fiscal_year_start integer,
  is_default boolean,
  logo_url text,
  favicon_url text,
  address text,
  created_at timestamptz,
  updated_at timestamptz,
  access_role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Companies the user owns
  SELECT c.id, c.user_id, c.name, c.currency, c.fiscal_year_start, 
         c.is_default, c.logo_url, c.favicon_url, c.address, 
         c.created_at, c.updated_at, 'owner'::app_role as access_role
  FROM public.companies c
  WHERE c.user_id = _user_id
  
  UNION
  
  -- Companies the user has access to
  SELECT c.id, c.user_id, c.name, c.currency, c.fiscal_year_start, 
         c.is_default, c.logo_url, c.favicon_url, c.address, 
         c.created_at, c.updated_at, ca.role as access_role
  FROM public.companies c
  JOIN public.company_access ca ON ca.company_id = c.id
  WHERE ca.user_id = _user_id
$$;