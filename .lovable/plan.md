

## Plan: Show Company Name in Customer and Invoice Views

### Overview
Add the company name display to both the Customer and Invoice components so users can clearly see which company each record belongs to. This is especially useful when viewing or managing records.

---

### 1. Changes to Invoice List

**File:** `src/components/invoices/InvoiceList.tsx`

Add a "Company" column to the invoice table that displays the company name. Since invoices are filtered by selected company, we can display the selected company name from context.

**Modifications:**
- Add a new `<TableHead>Company</TableHead>` column
- Add a new `<TableCell>` that shows the company name
- Import and use `useCompanyContext` to get the selected company name

---

### 2. Changes to Invoice Preview

**File:** `src/components/invoices/InvoicePreview.tsx`

The InvoicePreview already shows the company name at the top. This is already implemented - no changes needed here.

---

### 3. Changes to Customer Select

**File:** `src/components/invoices/CustomerSelect.tsx`

Add a small subtitle showing which company the customers belong to.

**Modifications:**
- Import `useCompanyContext`
- Add a header/subtitle in the popover showing "Customers for [Company Name]"

---

### 4. Changes to Customer Dialog

**File:** `src/components/invoices/CustomerDialog.tsx`

Show the company name in the dialog header so users know which company the customer will be created under.

**Modifications:**
- Import `useCompanyContext`
- Update the `DialogTitle` to include the company name, e.g., "Add New Customer - [Company Name]"

---

### 5. Optional: Create a Dedicated Customers Page

Currently, there's no dedicated page to list/manage customers. Creating one would provide a cleaner way to view all customers with their company association.

**New Files:**
- `src/pages/Customers.tsx` - Main customers page with table listing all customers
- Update `src/components/layout/AppSidebar.tsx` - Add "Customers" navigation link
- Update `src/App.tsx` - Add route for `/customers`

---

### Implementation Details

#### 5.1 Invoice List Table Update

```text
Current columns:
[Invoice #] [Customer] [Issue Date] [Due Date] [Status] [Amount] [Actions]

Updated columns:
[Invoice #] [Customer] [Company] [Issue Date] [Due Date] [Status] [Amount] [Actions]
```

The Company column will display the selected company name from the CompanyContext.

#### 5.2 Customer Select Header

```text
+---------------------------+
| Customers for ABC Company |
+---------------------------+
| Search customers...       |
+---------------------------+
| Customer 1                |
| Customer 2                |
| ...                       |
+---------------------------+
```

#### 5.3 Customer Dialog Title

```text
Current:  "Add New Customer"
Updated:  "Add New Customer - ABC Company"
```

---

### Files Summary

| Action | File Path |
|--------|-----------|
| Modify | `src/components/invoices/InvoiceList.tsx` |
| Modify | `src/components/invoices/CustomerSelect.tsx` |
| Modify | `src/components/invoices/CustomerDialog.tsx` |
| Create | `src/pages/Customers.tsx` (optional - dedicated customers page) |
| Modify | `src/components/layout/AppSidebar.tsx` (if adding Customers page) |
| Modify | `src/App.tsx` (if adding Customers page) |

---

### Technical Notes

- The company information comes from `useCompanyContext()` which provides `selectedCompany` with full company details including `name`, `address`, `logo_url`, etc.
- Since invoices and customers are already filtered by the selected company, the displayed company name will always match the current selection
- This provides visual confirmation to users that they're working within the correct company context

