-- Add parent_id column for hierarchical categories
ALTER TABLE public.categories 
ADD COLUMN parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Add index for faster hierarchical queries
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);