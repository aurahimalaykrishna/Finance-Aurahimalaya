-- Add new columns to companies table
ALTER TABLE public.companies
ADD COLUMN logo_url text,
ADD COLUMN favicon_url text,
ADD COLUMN address text;

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true);

-- RLS policies for the bucket
CREATE POLICY "Users can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own company assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own company assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');