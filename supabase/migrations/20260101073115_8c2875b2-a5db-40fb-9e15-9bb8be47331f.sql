-- Add currency column to transactions table
ALTER TABLE transactions 
ADD COLUMN currency TEXT DEFAULT 'NPR';

-- Update existing transactions to use their company's currency
UPDATE transactions t
SET currency = COALESCE(
  (SELECT c.currency FROM companies c WHERE c.id = t.company_id),
  'NPR'
);