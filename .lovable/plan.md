

## Plan: Fetch All Company Customers in Customer List and Invoice

### Overview
Update the customer fetching logic to support viewing customers from all companies (like Aurahimalaya Pvt Ltd, Nepal Visuals Pvt Ltd, etc.) when the "All Companies" view is selected, and show the company name for each customer.

---

### Current Behavior
- `useCustomers` hook only fetches customers for the **selected company**
- When "All Companies" is selected (`isAllCompanies = true`), `selectedCompanyId` becomes `null` and returns an empty array
- Users cannot see customers across all their companies

### Desired Behavior
- When a specific company is selected: Show only that company's customers
- When "All Companies" is selected: Show customers from **all accessible companies**
- Display the company name alongside each customer

---

### Changes Required

#### 1. Update `src/hooks/useCustomers.ts`

Modify the query to handle the "All Companies" case:

```typescript
// Current logic (line 41-52):
if (!selectedCompanyId) return [];
// Only fetches for selected company

// New logic:
// If isAllCompanies is true, fetch ALL customers
// Otherwise, filter by selectedCompanyId
```

**Key changes:**
- Accept `isAllCompanies` from the context
- When `isAllCompanies` is true, fetch all customers without company filter
- Update query key to include `isAllCompanies` for proper caching

---

#### 2. Update `src/components/invoices/CustomerSelect.tsx`

- Add company name display next to each customer
- Group customers by company (optional, for better organization)
- Update header to show "All Customers" when viewing all companies

**Visual change:**
```text
Current:
+---------------------------+
| Customers for ABC Company |
+---------------------------+
| Customer 1                |
| Customer 2                |

New (All Companies mode):
+---------------------------+
| All Customers             |
+---------------------------+
| Customer 1 - ABC Company  |
| Customer 2 - XYZ Company  |
```

---

#### 3. Update `src/pages/Customers.tsx`

The page already has logic for `isAllCompanies` and `getCompanyName()`, but it relies on `useCustomers` which doesn't fetch all companies' customers. Once the hook is updated, this page will automatically work correctly.

---

### Implementation Details

#### Updated useCustomers Hook Logic

```typescript
export function useCustomers() {
  const { user } = useAuth();
  const { selectedCompanyId, isAllCompanies } = useCompanyContext();
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['customers', selectedCompanyId, isAllCompanies],
    queryFn: async () => {
      // If "All Companies" is selected, fetch all customers
      if (isAllCompanies) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data as Customer[];
      }
      
      // Otherwise, filter by selected company
      if (!selectedCompanyId) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user && (!!selectedCompanyId || isAllCompanies),
  });

  // ... rest of the hook
}
```

---

#### CustomerSelect with Company Names

```typescript
// In CustomerSelect.tsx - show company name for each customer
{customers.map((customer) => (
  <CommandItem key={customer.id} ...>
    <div className="flex flex-col">
      <span>{customer.name}</span>
      <span className="text-xs text-muted-foreground">
        {customer.email && `${customer.email} • `}
        {getCompanyName(customer.company_id)}
      </span>
    </div>
  </CommandItem>
))}
```

---

### Files to Modify

| Action | File Path |
|--------|-----------|
| Modify | `src/hooks/useCustomers.ts` |
| Modify | `src/components/invoices/CustomerSelect.tsx` |

---

### Technical Notes

- RLS policies already allow users to see customers from all companies they have access to via `has_company_access(auth.uid(), company_id)`
- No database changes required
- The `companies` array from `useCompanyContext` can be used to look up company names

