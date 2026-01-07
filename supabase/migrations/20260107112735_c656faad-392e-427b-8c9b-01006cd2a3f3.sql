-- Drop existing policies
DROP POLICY IF EXISTS "Users can view company categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert company categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update company categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete company categories" ON public.categories;

-- Create new policies that allow shared categories (company_id IS NULL)

-- SELECT: Users can view company categories OR their own shared categories
CREATE POLICY "Users can view categories" 
ON public.categories 
FOR SELECT 
USING (
  (company_id IS NOT NULL AND has_company_access(auth.uid(), company_id))
  OR (company_id IS NULL AND user_id = auth.uid())
);

-- INSERT: Users can insert company categories OR their own shared categories
CREATE POLICY "Users can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    (company_id IS NOT NULL AND has_company_access(auth.uid(), company_id))
    OR company_id IS NULL
  )
);

-- UPDATE: Users can update company categories OR their own shared categories
CREATE POLICY "Users can update categories" 
ON public.categories 
FOR UPDATE 
USING (
  (company_id IS NOT NULL AND has_company_access(auth.uid(), company_id))
  OR (company_id IS NULL AND user_id = auth.uid())
);

-- DELETE: Users can delete company categories OR their own shared categories
CREATE POLICY "Users can delete categories" 
ON public.categories 
FOR DELETE 
USING (
  (company_id IS NOT NULL AND has_company_access(auth.uid(), company_id))
  OR (company_id IS NULL AND user_id = auth.uid())
);