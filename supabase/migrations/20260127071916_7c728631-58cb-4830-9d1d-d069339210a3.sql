-- Step 2: Update functions with complete role ordering

-- Update get_user_role function with complete role ordering
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'hr_manager' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'supervisor' THEN 5
      WHEN 'accountant' THEN 6 
      WHEN 'viewer' THEN 7 
      WHEN 'employee' THEN 8
    END
  LIMIT 1
$$;

-- Update get_user_company_role function with complete role ordering
CREATE OR REPLACE FUNCTION public.get_user_company_role(_user_id uuid, _company_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.company_access 
     WHERE user_id = _user_id AND company_id = _company_id),
    (SELECT role FROM public.user_roles WHERE user_id = _user_id 
     ORDER BY CASE role 
       WHEN 'owner' THEN 1 
       WHEN 'admin' THEN 2 
       WHEN 'hr_manager' THEN 3
       WHEN 'manager' THEN 4
       WHEN 'supervisor' THEN 5
       WHEN 'accountant' THEN 6 
       WHEN 'viewer' THEN 7 
       WHEN 'employee' THEN 8
     END
     LIMIT 1)
  )
$$;

-- Update get_team_members to include new role ordering
CREATE OR REPLACE FUNCTION public.get_team_members(_owner_id uuid)
RETURNS TABLE(user_id uuid, email text, role app_role, granted_by uuid, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (ur.user_id) ur.user_id, p.email, ur.role, ur.granted_by, ur.created_at
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.granted_by = _owner_id 
     OR ur.user_id = _owner_id
     OR ur.user_id IN (
       SELECT ca.user_id 
       FROM public.company_access ca
       JOIN public.companies c ON c.id = ca.company_id
       WHERE c.user_id = _owner_id
     )
  ORDER BY ur.user_id, 
    CASE ur.role 
      WHEN 'owner' THEN 1 
      WHEN 'admin' THEN 2 
      WHEN 'hr_manager' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'supervisor' THEN 5
      WHEN 'accountant' THEN 6 
      WHEN 'viewer' THEN 7 
      WHEN 'employee' THEN 8
    END
$$;