

## Plan: Add Invoice Features for Each Company

### Overview
Add a complete invoice management system that allows users to create, manage, and track invoices per company. The feature will include invoice creation with line items, customer management (clients/customers to invoice), status tracking, and PDF generation capability.

---

### 1. Database Schema

#### 1.1 New Tables

**`customers` table** - Store clients/customers who receive invoices
```sql
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**`invoices` table** - Main invoice records
```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, sent, paid, overdue, cancelled
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NPR',
  notes TEXT,
  terms TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**`invoice_items` table** - Line items for each invoice
```sql
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 1.2 Database Functions

**Auto-generate invoice numbers** - Function to create sequential invoice numbers per company
```sql
CREATE FUNCTION generate_invoice_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num 
  FROM invoices WHERE company_id = p_company_id;
  prefix := 'INV-';
  RETURN prefix || LPAD(next_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
```

#### 1.3 RLS Policies

All tables will use `has_company_access(auth.uid(), company_id)` for RLS, following the existing pattern.

---

### 2. Frontend Components

#### 2.1 New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useInvoices.ts` | React Query hooks for invoice CRUD operations |
| `src/hooks/useCustomers.ts` | React Query hooks for customer management |
| `src/components/invoices/InvoiceDialog.tsx` | Create/Edit invoice form with line items |
| `src/components/invoices/InvoiceList.tsx` | Display invoices in a table |
| `src/components/invoices/InvoicePreview.tsx` | Preview invoice before sending |
| `src/components/invoices/InvoiceItemsEditor.tsx` | Add/edit line items in invoice |
| `src/components/invoices/InvoiceStatusBadge.tsx` | Status badge component |
| `src/components/invoices/CustomerDialog.tsx` | Add/edit customer |
| `src/components/invoices/CustomerSelect.tsx` | Dropdown to select customer |
| `src/pages/Invoices.tsx` | Main invoices page |

#### 2.2 Invoice Dialog Features

The invoice creation/editing dialog will include:
- Customer selection (with option to create new)
- Invoice date and due date pickers
- Dynamic line items table with add/remove
- Automatic subtotal, tax, and total calculations
- Notes and payment terms fields
- Currency selection

#### 2.3 Invoice List Features

- Filter by status (Draft, Sent, Paid, Overdue, Cancelled)
- Search by invoice number or customer name
- Sort by date, amount, or status
- Quick actions: View, Edit, Mark as Paid, Send, Delete
- Summary cards showing totals by status

---

### 3. Navigation Updates

#### 3.1 Update `AppSidebar.tsx`

Add "Invoices" link to the main navigation items:
```typescript
const mainItems = [
  // ... existing items
  { title: 'Invoices', url: '/invoices', icon: FileText },
];
```

#### 3.2 Update `App.tsx`

Add route for the Invoices page:
```typescript
<Route path="/invoices" element={<Invoices />} />
```

---

### 4. Implementation Sequence

```text
+----------------------------+
|  Phase 1: Database Setup   |
+----------------------------+
        |
        v
+----------------------------+
| 1. Create customers table  |
| 2. Create invoices table   |
| 3. Create invoice_items    |
| 4. Add RLS policies        |
| 5. Create helper functions |
+----------------------------+
        |
        v
+----------------------------+
|  Phase 2: Customer Hook    |
+----------------------------+
        |
        v
+----------------------------+
| src/hooks/useCustomers.ts  |
| - CRUD operations          |
| - Company filtering        |
+----------------------------+
        |
        v
+----------------------------+
|  Phase 3: Invoice Hook     |
+----------------------------+
        |
        v
+----------------------------+
| src/hooks/useInvoices.ts   |
| - CRUD operations          |
| - Status updates           |
| - Line item management     |
| - Statistics calculations  |
+----------------------------+
        |
        v
+----------------------------+
|  Phase 4: UI Components    |
+----------------------------+
        |
        v
+----------------------------+
| CustomerDialog.tsx         |
| CustomerSelect.tsx         |
| InvoiceItemsEditor.tsx     |
| InvoiceDialog.tsx          |
| InvoiceStatusBadge.tsx     |
| InvoiceList.tsx            |
| InvoicePreview.tsx         |
+----------------------------+
        |
        v
+----------------------------+
|  Phase 5: Page & Routes    |
+----------------------------+
        |
        v
+----------------------------+
| Invoices.tsx page          |
| AppSidebar.tsx update      |
| App.tsx route update       |
+----------------------------+
```

---

### 5. Technical Details

#### 5.1 Invoice Status Flow

```text
DRAFT --> SENT --> PAID
  |         |
  v         v
CANCELLED  OVERDUE (automatic based on due_date)
```

#### 5.2 Line Item Calculations

```typescript
// Per line item
const itemAmount = quantity * unitPrice;
const itemTax = itemAmount * (taxRate / 100);

// Invoice totals
const subtotal = sum of all itemAmounts;
const taxAmount = sum of all itemTaxes;
const total = subtotal + taxAmount - discountAmount;
```

#### 5.3 Invoice Number Generation

Invoice numbers will be auto-generated per company using the format:
`INV-00001`, `INV-00002`, etc.

---

### 6. Files Summary

| Action | File Path |
|--------|-----------|
| Create | `supabase/migrations/xxx_add_invoices.sql` |
| Create | `src/hooks/useCustomers.ts` |
| Create | `src/hooks/useInvoices.ts` |
| Create | `src/components/invoices/CustomerDialog.tsx` |
| Create | `src/components/invoices/CustomerSelect.tsx` |
| Create | `src/components/invoices/InvoiceDialog.tsx` |
| Create | `src/components/invoices/InvoiceItemsEditor.tsx` |
| Create | `src/components/invoices/InvoiceStatusBadge.tsx` |
| Create | `src/components/invoices/InvoiceList.tsx` |
| Create | `src/components/invoices/InvoicePreview.tsx` |
| Create | `src/pages/Invoices.tsx` |
| Modify | `src/components/layout/AppSidebar.tsx` |
| Modify | `src/App.tsx` |

---

### 7. Future Enhancements (Not in Initial Scope)

- PDF export/download
- Email invoice to customer
- Recurring invoices
- Payment tracking linked to transactions
- Invoice templates/branding per company

