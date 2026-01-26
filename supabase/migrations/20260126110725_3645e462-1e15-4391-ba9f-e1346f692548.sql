-- Update has_company_access function to also check if user is an active employee
CREATE OR REPLACE FUNCTION public.has_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User owns the company
    SELECT 1 FROM public.companies 
    WHERE id = _company_id AND user_id = _user_id
    UNION
    -- User has been granted access
    SELECT 1 FROM public.company_access 
    WHERE company_id = _company_id AND user_id = _user_id
    UNION
    -- User is an active employee of the company
    SELECT 1 FROM public.employees 
    WHERE company_id = _company_id 
    AND user_id = _user_id 
    AND is_active = true
  )
$$;