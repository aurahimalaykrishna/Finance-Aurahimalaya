-- Add role column to company_access table
ALTER TABLE public.company_access 
ADD COLUMN role app_role NOT NULL DEFAULT 'viewer';

-- Create index for faster lookups
CREATE INDEX idx_company_access_user_company 
ON public.company_access(user_id, company_id);

-- Add company_id to team_invitations for company-specific invites
ALTER TABLE public.team_invitations
ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- Get user's role for a specific company (falls back to global role)
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
       WHEN 'accountant' THEN 3 
       WHEN 'viewer' THEN 4 
     END
     LIMIT 1)
  )
$$;

-- Get all companies with roles for a user
CREATE OR REPLACE FUNCTION public.get_user_company_access(_user_id uuid)
RETURNS TABLE(company_id uuid, company_name text, role app_role, granted_by uuid, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ca.company_id, c.name, ca.role, ca.granted_by, ca.created_at
  FROM public.company_access ca
  JOIN public.companies c ON c.id = ca.company_id
  WHERE ca.user_id = _user_id
$$;

-- Get all users with access to a specific company
CREATE OR REPLACE FUNCTION public.get_company_users(_company_id uuid)
RETURNS TABLE(user_id uuid, email text, role app_role, granted_by uuid, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ca.user_id, p.email, ca.role, ca.granted_by, ca.created_at
  FROM public.company_access ca
  JOIN public.profiles p ON p.id = ca.user_id
  WHERE ca.company_id = _company_id
$$;

-- Update RLS policies for company_access to allow role management
DROP POLICY IF EXISTS "Owners can manage company access" ON public.company_access;
DROP POLICY IF EXISTS "Owners can view all company access" ON public.company_access;
DROP POLICY IF EXISTS "Users can view their own company access" ON public.company_access;

CREATE POLICY "Owners can insert company access" 
ON public.company_access 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can update company access" 
ON public.company_access 
FOR UPDATE 
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can delete company access" 
ON public.company_access 
FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners can view all company access" 
ON public.company_access 
FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Users can view their own company access" 
ON public.company_access 
FOR SELECT 
USING (auth.uid() = user_id);