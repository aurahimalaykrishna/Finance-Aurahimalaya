-- Add vat_collected field to companies table for manual VAT entry
ALTER TABLE public.companies 
ADD COLUMN vat_collected numeric DEFAULT 0;