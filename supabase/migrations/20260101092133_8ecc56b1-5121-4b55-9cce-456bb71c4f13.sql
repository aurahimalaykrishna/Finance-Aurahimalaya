-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view team profiles" ON public.profiles;

-- Create new SELECT policies that explicitly require authentication
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Owners can view team profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'owner'::app_role));