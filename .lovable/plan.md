
# Plan: Make Amount Column Editable in Invoice Items

## Problem

The Amount column in the invoice items table is currently read-only and auto-calculated. The user wants to manually enter the amount directly, with the amount being independent (not derived from Unit Price/Qty/Tax calculations).

## Root Cause Analysis

In `InvoiceItemsEditor.tsx`, the Amount column displays only the calculated value:
```tsx
<TableCell className="text-right font-medium">
  {currency} {formatCurrency(item.amount)}
</TableCell>
```

This is a static display cell, not an editable Input. All other fields (Description, Qty, Unit Price, Tax %) are Input components, but Amount is not.

## Solution

Convert the Amount column from a read-only display to an editable Input field, similar to the other columns. When the user edits Amount directly, it will be stored as-is without any automatic recalculation.

## Technical Implementation

### File: `src/components/invoices/InvoiceItemsEditor.tsx`

**Change 1: Update the Amount cell to use an Input component**

Replace the static text display (lines 131-133):
```tsx
<TableCell className="text-right font-medium">
  {currency} {formatCurrency(item.amount)}
</TableCell>
```

With an editable input:
```tsx
<TableCell>
  <div className="flex items-center justify-end gap-1">
    <span className="text-sm text-muted-foreground">{currency}</span>
    <Input
      type="number"
      value={item.amount}
      onChange={(e) => updateItem(index, 'amount', e.target.value)}
      min="0"
      step="0.01"
      className="border-0 focus-visible:ring-0 p-0 h-auto w-24 text-right font-medium pointer-events-auto"
    />
  </div>
</TableCell>
```

**Change 2: Remove auto-calculation override in updateItem function**

Currently, `updateItem` recalculates `amount` whenever `quantity`, `unit_price`, or `tax_rate` changes. Since the user wants Amount to be independent, we have two options:

**Option A (Recommended)**: Keep auto-calculation for other fields, but allow direct Amount edits to override
- When user edits Qty/Price/Tax, Amount auto-calculates
- When user edits Amount directly, it stores that value without recalculation

This is already how the code works - the recalculation only triggers for specific fields. Adding Amount as an editable field means manual entry will persist.

## Summary of Changes

| Location | Change |
|----------|--------|
| `InvoiceItemsEditor.tsx` (lines 131-133) | Replace static Amount display with editable Input component |

This single change will:
1. Make the Amount field clickable and editable
2. Allow users to type any amount value directly
3. Use the same `pointer-events-auto` fix as other inputs for modal compatibility
4. Keep the auto-calculation behavior when editing other fields (Qty, Unit Price, Tax)
