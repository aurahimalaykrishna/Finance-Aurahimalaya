
# Fix Invoice Totals Calculation

## Problem
After making the Amount column editable and independent, the Subtotal, Tax, and Total fields in the invoice dialog are not updating. They still calculate based on `Quantity x Unit Price` instead of using the independent `Amount` value that users enter.

## Root Cause
In `InvoiceDialog.tsx`, the totals calculation ignores the `item.amount` field:

```typescript
const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
const taxAmount = items.reduce((sum, item) => {
  const itemBase = item.quantity * item.unit_price;
  return sum + (itemBase * (item.tax_rate / 100));
}, 0);
```

Since Amount is now independent and editable, the system should use `item.amount` as the source of truth for calculating the invoice total.

## Solution
Update the totals calculation in `InvoiceDialog.tsx` to:
1. Use `item.amount` directly for the subtotal (sum of all line item amounts)
2. Calculate tax separately based on the base price before tax was added
3. Total = Sum of all amounts - discount

## Technical Changes

### File: `src/components/invoices/InvoiceDialog.tsx`

**Update the `useMemo` totals calculation (lines 137-147)**

Current logic:
```typescript
const totals = useMemo(() => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = items.reduce((sum, item) => {
    const itemBase = item.quantity * item.unit_price;
    return sum + (itemBase * (item.tax_rate / 100));
  }, 0);
  const discountAmount = form.watch('discount_amount') || 0;
  const totalAmount = subtotal + taxAmount - discountAmount;
  return { subtotal, taxAmount, discountAmount, totalAmount };
}, [items, form.watch('discount_amount')]);
```

New logic:
```typescript
const totals = useMemo(() => {
  // Use item.amount as source of truth (includes tax already)
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate the tax portion that's embedded in the amounts
  const taxAmount = items.reduce((sum, item) => {
    // If tax rate > 0, extract tax from amount: tax = amount - (amount / (1 + rate/100))
    if (item.tax_rate > 0) {
      const taxMultiplier = 1 + (item.tax_rate / 100);
      const baseAmount = item.amount / taxMultiplier;
      return sum + (item.amount - baseAmount);
    }
    return sum;
  }, 0);
  
  const discountAmount = form.watch('discount_amount') || 0;
  const totalAmount = subtotal - discountAmount;
  
  return { subtotal, taxAmount, discountAmount, totalAmount };
}, [items, form.watch('discount_amount')]);
```

## Summary

| File | Change |
|------|--------|
| `src/components/invoices/InvoiceDialog.tsx` | Update totals calculation to use `item.amount` as source of truth |

This ensures that when users manually edit the Amount field, the Subtotal and Total immediately reflect those changes.
