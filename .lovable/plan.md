
# Plan: Fix Category Visibility Across Team Members - COMPLETED

## Problem
Categories created by one user weren't visible to other team members.

## Root Cause
Categories were being saved with `company_id = NULL`, making them personal categories only visible to the creator due to RLS policies.

## Solution Applied

### Step 1: Database Fix ✓
Updated existing categories to associate with companies based on transaction usage:
```sql
UPDATE categories c
SET company_id = (
  SELECT t.company_id FROM transactions t 
  WHERE t.category_id = c.id 
  GROUP BY t.company_id ORDER BY COUNT(*) DESC LIMIT 1
)
WHERE c.company_id IS NULL
AND EXISTS (SELECT 1 FROM transactions t WHERE t.category_id = c.id);
```

### Step 2: Code Fix ✓
- Updated `useCategories` hook to accept a `defaultCompanyIdForCreate` parameter
- Modified `Categories.tsx` to pass `selectedCompanyId` as the default for new categories

## Result
- All team members can now see shared categories
- New categories are automatically scoped to the selected company
- Category assignments on transactions are visible across all dashboards
