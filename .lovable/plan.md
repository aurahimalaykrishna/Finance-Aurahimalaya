
# Plan: Fix Category Visibility Across Team Members

## Problem Identified

When one user (Ishan - accountant) assigns a category to a transaction, the category name does not show for other users (Krishna - owner) on the dashboard/transaction list.

### Root Cause Analysis

1. **Categories are being created with `company_id = NULL`**
   - When Ishan creates categories, they're saved as "personal" categories (not company-scoped)
   - Most categories in the database have `company_id = NULL`

2. **RLS Policy Restriction**
   - The current RLS policy for categories:
     - Categories WITH `company_id` are visible to anyone with company access
     - Categories WITHOUT `company_id` (NULL) are ONLY visible to the user who created them
   
3. **Transaction Display Issue**
   - When Krishna views transactions, the Supabase query does a LEFT JOIN to categories
   - RLS blocks Krishna from seeing Ishan's personal categories
   - The category_id is stored in the transaction, but the joined category data returns NULL
   - Result: Krishna sees the transaction but the category appears empty/unassigned

### Database Evidence

| User | Role | Categories Created | company_id |
|------|------|-------------------|------------|
| ishan@aurahimalaya.org | Accountant | "Premium software", "COGS", etc. | NULL |
| krishna@aurahimalaya.org | Owner | "Operating Cost" | Has company_id |

---

## Solution

We need to fix this at two levels:

### Part 1: Database Fix - Update Existing Categories

Update all existing personal categories (where `company_id` is NULL) to be associated with a company so they become visible to all team members.

Since Ishan has access to multiple companies, we'll need to update categories based on the transactions they're used in, or set a default company for global categories.

```sql
-- Option A: Update categories to be shared across ALL companies
-- by setting them to the most commonly used company
UPDATE categories c
SET company_id = (
  SELECT t.company_id 
  FROM transactions t 
  WHERE t.category_id = c.id 
  AND t.company_id IS NOT NULL
  GROUP BY t.company_id 
  ORDER BY COUNT(*) DESC 
  LIMIT 1
)
WHERE c.company_id IS NULL
AND EXISTS (
  SELECT 1 FROM transactions t WHERE t.category_id = c.id
);
```

### Part 2: Code Fix - Auto-assign Company to New Categories

Modify the category creation to automatically use the selected company ID from context.

**File: `src/hooks/useCategories.ts`**

```typescript
// In createCategory mutation:
const { error } = await supabase.from('categories').insert({
  ...data,
  // Use provided company_id, fallback to selected company from context
  company_id: data.company_id || selectedCompanyId || null,
  user_id: user!.id,
} as any);
```

### Part 3: Pass Company Context to useCategories

Update the hook to accept and use the company context for new category creation.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCategories.ts` | Ensure new categories get company_id from context |
| `src/pages/Categories.tsx` | Pass selectedCompanyId to create mutation |

---

## Implementation Steps

### Step 1: Database Migration
Run SQL to update existing categories with NULL company_id to have proper company associations based on their usage in transactions.

### Step 2: Update useCategories Hook
Modify the `createCategory` mutation to automatically set `company_id` from the selected company context when creating new categories.

### Step 3: Verify UI Changes
Ensure the Categories page passes the correct company context when creating/editing categories.

---

## Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Categories not visible to other users | RLS blocks NULL company_id categories | Update existing categories to have company_id |
| New categories will have same issue | No auto-company assignment | Auto-set company_id from context |

This fix ensures:
1. All team members can see shared categories
2. New categories are automatically scoped to the current company
3. Category assignments on transactions are visible across all dashboards
