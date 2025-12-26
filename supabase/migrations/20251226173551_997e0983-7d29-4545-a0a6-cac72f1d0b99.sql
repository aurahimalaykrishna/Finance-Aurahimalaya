-- Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'accountant', 'viewer');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create team_invitations table for invite flow
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create company_access table (which companies can team members access)
CREATE TABLE public.company_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_access ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Function to get user's highest role
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
      WHEN 'accountant' THEN 3 
      WHEN 'viewer' THEN 4 
    END
  LIMIT 1
$$;

-- Function to get all team members for an owner's account
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
  SELECT ur.user_id, p.email, ur.role, ur.granted_by, ur.created_at
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.granted_by = _owner_id 
     OR ur.user_id = _owner_id
$$;

-- Auto-assign 'owner' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (NEW.id, 'owner', NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all team roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete roles except their own"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'owner') AND user_id != auth.uid());

-- RLS Policies for team_invitations
CREATE POLICY "Owners and admins can view invitations"
  ON public.team_invitations FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['owner', 'admin']::app_role[]));

CREATE POLICY "Owners and admins can create invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['owner', 'admin']::app_role[]));

CREATE POLICY "Owners and admins can update invitations"
  ON public.team_invitations FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['owner', 'admin']::app_role[]));

CREATE POLICY "Owners and admins can delete invitations"
  ON public.team_invitations FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['owner', 'admin']::app_role[]));

-- RLS Policies for company_access
CREATE POLICY "Users can view their own company access"
  ON public.company_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all company access"
  ON public.company_access FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can manage company access"
  ON public.company_access FOR ALL
  USING (public.has_role(auth.uid(), 'owner'));