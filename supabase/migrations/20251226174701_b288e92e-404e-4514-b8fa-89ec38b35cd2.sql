-- Add profile fields for user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Allow owners to view team member profiles (for user management)
CREATE POLICY "Owners can view team profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'owner'::app_role));

-- Allow owners to update team member profiles
CREATE POLICY "Owners can update team profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'owner'::app_role));