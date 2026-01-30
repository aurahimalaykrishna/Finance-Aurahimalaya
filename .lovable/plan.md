
# Plan: Fix Customer Dropdown Selection in Invoice Dialog

## Problem Identified

The customer dropdown (combobox) inside the Invoice creation dialog closes immediately when trying to select a customer. This is a known focus management conflict between:
- The `Dialog` component (manages focus for accessibility)
- The `Popover` component (also manages focus by default)
- The `Command` input (handles keyboard navigation)

When the Popover opens inside a Dialog, focus events conflict and cause the popover to close prematurely.

---

## Solution

Add `modal={false}` to the Popover component in `CustomerSelect.tsx`. This tells the Popover not to manage focus independently, deferring to the parent Dialog's focus management.

---

## Technical Details

### File to Modify

**`src/components/invoices/CustomerSelect.tsx`**

### Change Required

```tsx
// Before (line 41)
<Popover open={open} onOpenChange={setOpen}>

// After
<Popover open={open} onOpenChange={setOpen} modal={false}>
```

### Why This Works

- When `modal={true}` (default), the Popover creates a focus trap and blocks interaction outside
- The Dialog also creates a focus trap
- These two focus traps conflict, causing the popover to close when focus changes
- Setting `modal={false}` tells the Popover to behave as a non-modal component, allowing the Dialog to remain in control of focus

---

## Implementation Summary

| File | Change |
|------|--------|
| `src/components/invoices/CustomerSelect.tsx` | Add `modal={false}` to the Popover component |

This is a single-line fix that resolves the focus conflict between the Dialog and Popover components.
