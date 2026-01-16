-- Add cash tracking columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS cash_in_hand numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_in_bank numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS investment numeric DEFAULT 0;