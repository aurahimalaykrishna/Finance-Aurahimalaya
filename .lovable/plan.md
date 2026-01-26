

## Plan: Show All Companies on Customers CRUD

### Overview
Enable full CRUD operations for customers across all companies by adding a company selector in the CustomerDialog. This allows users to create/edit customers for any company, regardless of the current company selection.

---

### Current Behavior
- When "All Companies" is selected: Users can see customers from all companies but cannot add new ones (the dialog only works with selectedCompany)
- When a specific company is selected: Users can only create customers for that company
- The CustomerDialog shows the company name but doesn't allow changing it

### Desired Behavior
- Users should be able to create customers for any company they have access to
- When editing a customer, show which company they belong to (read-only)
- When creating a new customer in "All Companies" mode, require company selection

---

### Changes Required

#### 1. Update `src/hooks/useCustomers.ts`

Modify the `createCustomer` mutation to accept an optional `company_id` parameter, allowing customers to be created for a specific company:

```typescript
// Current (simplified):
createCustomer.mutateAsync({ name: "Customer" })
// Uses selectedCompanyId internally

// New:
createCustomer.mutateAsync({ name: "Customer", company_id: "specific-company-id" })
// Uses provided company_id or falls back to selectedCompanyId
```

---

#### 2. Update `src/components/invoices/CustomerDialog.tsx`

Add a company selector dropdown that:
- Shows all available companies when creating a new customer
- Is required when in "All Companies" mode
- Pre-selects the current company when one is selected
- Shows company name as read-only when editing an existing customer

**Visual changes:**
```text
Add New Customer
+---------------------------+
| Company *                 |
| [Select company...    v]  |  <-- New field
+---------------------------+
| Name *                    |
| [Customer name        ]   |
+---------------------------+
| Email        | Phone      |
| [email@...]  | [+977...]  |
+---------------------------+
```

---

#### 3. Update `src/pages/Customers.tsx`

Ensure the "Add Customer" button works correctly in "All Companies" mode by:
- Allowing the dialog to open even when no specific company is selected
- The dialog will require company selection in this case

---

### Files to Modify

| Action | File Path | Changes |
|--------|-----------|---------|
| Modify | `src/hooks/useCustomers.ts` | Add optional `company_id` parameter to `CustomerInsert` and `createCustomer` mutation |
| Modify | `src/components/invoices/CustomerDialog.tsx` | Add company selector dropdown using existing Select component |

---

### Technical Notes

- Uses existing `companies` array from `useCompanyContext` for the dropdown
- Validation ensures a company is selected before form submission
- When editing, the company field is read-only (customers cannot be moved between companies)
- The query invalidation will use the correct company ID from the form data

