

# Plan: Fix Currency Mismatch for Aurahimalaya LLC Transactions

## Problem Identified

After investigating the database, I found that **Aurahimalaya LLC** has its company currency correctly set to **USD**, but all **425 transactions** for this company have `currency: NPR` stored in the database.

This is legacy data that was created before proper currency handling was implemented. The code is working correctly - it displays the transaction's own currency field, which happens to be NPR for all these historical transactions.

---

## Database Evidence

| Company | Company Currency | Transaction Count | Transaction Currency |
|---------|-----------------|-------------------|---------------------|
| Aurahimalaya LLC | USD | 425 | NPR (incorrect) |
| Aurahimalaya Pvt Ltd | NPR | Many | NPR (correct) |

---

## Solution

We need to update the existing transactions in the database to use the correct currency based on their company's currency setting.

### SQL Migration

Run an UPDATE query to fix the mismatched transaction currencies:

```sql
-- Update transactions to use their company's currency
UPDATE transactions t
SET currency = c.currency
FROM companies c
WHERE t.company_id = c.id
  AND t.currency != c.currency;
```

This will:
1. Find all transactions where the transaction currency differs from the company currency
2. Update those transactions to use the company's currency

### Specific Fix for Aurahimalaya LLC

If you prefer to only fix this specific company:

```sql
UPDATE transactions
SET currency = 'USD'
WHERE company_id = '0456e3e1-b5e5-4c35-95b1-82aa16eddc5c'
  AND currency = 'NPR';
```

---

## Implementation Steps

1. **Run the database migration** to fix historical transaction currencies
2. No code changes required - the UI correctly displays transaction currencies

---

## Summary

The issue is **data-related, not code-related**. Historical transactions were created with NPR as the default currency before proper currency handling was implemented. Running the SQL migration will update all 425 transactions for Aurahimalaya LLC from NPR to USD.

