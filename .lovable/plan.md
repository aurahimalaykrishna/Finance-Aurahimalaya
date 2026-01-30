

# Plan: Fix Invoice Viewing and Add Download Feature

## Problem Summary

1. **View Invoice Issue**: When clicking "View" on an invoice, the preview dialog loads but may show loading indefinitely or make duplicate API calls due to `getInvoiceWithItems` being recreated on every render
2. **Download Feature Missing**: Users need the ability to download invoices as PDF files

## Root Cause Analysis

### View Invoice Bug

In `src/hooks/useInvoices.ts`, the `getInvoiceWithItems` function is defined as a plain async function:

```typescript
const getInvoiceWithItems = async (invoiceId: string): Promise<Invoice | null> => {
  // ...fetch logic
};
```

This function is NOT memoized with `useCallback`, so it gets a new reference on every render. In `InvoicePreview.tsx`, it's used as a useEffect dependency:

```typescript
useEffect(() => {
  const loadInvoice = async () => {
    if (invoice && open) {
      const data = await getInvoiceWithItems(invoice.id);
      // ...
    }
  };
  loadInvoice();
}, [invoice, open, getInvoiceWithItems]); // <-- getInvoiceWithItems changes every render!
```

This causes infinite re-renders or duplicate API calls, making the view functionality unreliable.

## Solution

### Fix 1: Memoize getInvoiceWithItems

Wrap the function with `useCallback` to maintain a stable reference:

```text
File: src/hooks/useInvoices.ts

Add useCallback import and wrap the function:

const getInvoiceWithItems = useCallback(async (invoiceId: string): Promise<Invoice | null> => {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`*, customer:customers(*)`)
    .eq('id', invoiceId)
    .single();

  if (invoiceError) throw invoiceError;

  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at');

  if (itemsError) throw itemsError;

  return { ...invoice, invoice_items: items } as Invoice;
}, []);
```

### Fix 2: Add Download Invoice Feature

Create a PDF download using browser print functionality (no external dependencies needed):

**File: src/components/invoices/InvoicePreview.tsx**

Add a Download button in the dialog header that:
1. Uses the existing invoice preview layout
2. Triggers browser print dialog with PDF option
3. Applies print-specific CSS for clean output

**Changes:**
- Add Download and Print buttons to the dialog
- Create a printable div with proper styling
- Use `window.print()` with CSS `@media print` rules
- Alternative: Generate PDF using canvas/HTML conversion

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useInvoices.ts` | Add `useCallback` import, wrap `getInvoiceWithItems` |
| `src/components/invoices/InvoicePreview.tsx` | Add Download/Print buttons, add print styles |
| `src/components/invoices/InvoiceList.tsx` | Add Download option to dropdown menu |

### InvoicePreview Changes

```text
1. Add Button imports (Download, Printer icons)
2. Add print handler function:
   const handlePrint = () => {
     window.print();
   };
3. Add buttons in dialog header:
   <Button variant="outline" size="sm" onClick={handlePrint}>
     <Download className="h-4 w-4 mr-2" />
     Download
   </Button>
4. Add print-specific CSS:
   - Hide dialog overlay when printing
   - Show only invoice content
   - Apply professional styling
```

### InvoiceList Changes

Add a "Download" menu item in the actions dropdown:

```text
<DropdownMenuItem onClick={() => handleDownload(invoice)}>
  <Download className="mr-2 h-4 w-4" />
  Download
</DropdownMenuItem>
```

## Implementation Order

1. **Fix getInvoiceWithItems memoization** in useInvoices.ts
2. **Add print styles** to index.css for clean PDF output
3. **Add Download/Print buttons** to InvoicePreview component
4. **Add Download option** to InvoiceList dropdown menu

## Expected Outcome

After implementation:
- Invoice preview will load reliably without duplicate API calls
- Users can download invoices as PDF using browser print functionality
- Download is accessible from both the View dialog and the actions dropdown

