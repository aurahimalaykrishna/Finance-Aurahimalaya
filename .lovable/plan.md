
# Plan: Fix Currency Display Fallback in Transactions Page

## Problem Identified

The Transactions page displays amounts in NPR (Nepalese Rupee) instead of the user's configured default currency (e.g., AUD for Skytrips Australia) when viewing "All Companies" mode.

### Root Cause

When the user selects "All Companies" in the company switcher, `selectedCompany` becomes `null`. The Transactions page currently has this fallback:

```typescript
getCurrencySymbol(selectedCompany?.currency || 'NPR')
```

Since `selectedCompany` is `null`, it always defaults to NPR instead of using the user's profile default currency.

### Correct Pattern (from Dashboard.tsx)

The Dashboard page handles this correctly:

```typescript
const { profile } = useProfile();
const defaultCurrency = selectedCompany?.currency || profile?.currency || 'NPR';
const currencySymbol = getCurrencySymbol(defaultCurrency);
```

This provides a proper fallback chain:
1. First, try the selected company's currency
2. If none (All Companies mode), use the user's profile default currency
3. Finally, fall back to NPR only as a last resort

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Transactions.tsx` | Import useProfile hook and update currency symbol references |

---

## Implementation Details

### Step 1: Import the useProfile hook

Add to the imports at the top of Transactions.tsx:

```typescript
import { useProfile } from '@/hooks/useProfile';
```

### Step 2: Use the hook in the component

Add near the other hook calls (around line 33):

```typescript
const { profile } = useProfile();
```

### Step 3: Create a consistent currency variable

Add after the hook declarations:

```typescript
// Get currency symbol based on selected company or profile default
const defaultCurrency = selectedCompany?.currency || profile?.currency || 'NPR';
```

### Step 4: Update all currency references

Replace all instances of:
```typescript
getCurrencySymbol(selectedCompany?.currency || 'NPR')
```

With:
```typescript
getCurrencySymbol(defaultCurrency)
```

#### Locations to update (lines from the current file):
- Line 491: Category stats - Total Transactions amount
- Line 515: Category stats - Categorized amount
- Line 540: Category stats - Uncategorized amount
- Line 572: Edit transaction dialog `defaultCurrency` prop

Also update these form-related fallbacks:
- Line 59: Initial form data currency
- Line 69: Company change handler currency fallback
- Line 79: Effect sync currency fallback
- Line 244: Form reset currency

---

## Summary of Changes

1. Add `useProfile` import
2. Call `useProfile()` hook to get the user's profile
3. Create `defaultCurrency` variable with proper fallback chain
4. Replace all hardcoded `'NPR'` fallbacks with the dynamic `defaultCurrency`

This ensures that when viewing "All Companies", the Transactions page will display amounts using the user's configured profile currency instead of always defaulting to NPR.
