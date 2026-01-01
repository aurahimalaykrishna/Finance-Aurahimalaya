-- Update get_team_members function to also include users who have access to owner's companies
CREATE OR REPLACE FUNCTION public.get_team_members(_owner_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  role app_role,
  granted_by uuid,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ur.user_id, p.email, ur.role, ur.granted_by, ur.created_at
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.granted_by = _owner_id 
     OR ur.user_id = _owner_id
     -- Also include users who have access to owner's companies
     OR ur.user_id IN (
       SELECT ca.user_id 
       FROM public.company_access ca
       JOIN public.companies c ON c.id = ca.company_id
       WHERE c.user_id = _owner_id
     )
$$;