-- Drop and recreate get_user_companies function to include new columns
DROP FUNCTION IF EXISTS public.get_user_companies(uuid);

CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, name text, currency text, fiscal_year_start integer, is_default boolean, logo_url text, favicon_url text, address text, created_at timestamp with time zone, updated_at timestamp with time zone, access_role app_role, cash_in_hand numeric, cash_in_bank numeric, investment numeric, vat_collected numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Companies the user owns
  SELECT c.id, c.user_id, c.name, c.currency, c.fiscal_year_start, 
         c.is_default, c.logo_url, c.favicon_url, c.address, 
         c.created_at, c.updated_at, 'owner'::app_role as access_role,
         c.cash_in_hand, c.cash_in_bank, c.investment, c.vat_collected
  FROM public.companies c
  WHERE c.user_id = _user_id
  
  UNION
  
  -- Companies the user has access to
  SELECT c.id, c.user_id, c.name, c.currency, c.fiscal_year_start, 
         c.is_default, c.logo_url, c.favicon_url, c.address, 
         c.created_at, c.updated_at, ca.role as access_role,
         c.cash_in_hand, c.cash_in_bank, c.investment, c.vat_collected
  FROM public.companies c
  JOIN public.company_access ca ON ca.company_id = c.id
  WHERE ca.user_id = _user_id
$function$;