

## Plan: Add VAT Amount Return Field for Companies

### Overview
Add a "VAT Amount Return" field to track VAT collected from local business sales (invoices). This field will show the total VAT amount that needs to be returned/reported based on all sales invoices issued for each company.

---

### Understanding the Requirement

**VAT Amount Return** = Total VAT (tax_amount) collected from all invoices issued to local business customers

This is a computed value that aggregates the `tax_amount` from all invoices for each company, which represents the VAT that needs to be reported/returned to the tax authorities.

---

### Implementation Approach

Since VAT Return is a **calculated value** based on invoice data (not a static field), I recommend:

1. **Calculate VAT Return dynamically** from invoice data rather than storing it as a static field
2. **Display it alongside other financial metrics** (Cash in Hand, Cash in Bank, Investment)
3. **Add it to the Company Dashboard/Profile** for easy viewing

---

### Changes Required

#### 1. Create VAT Return Hook - `src/hooks/useVATReturn.ts`

Create a new hook that calculates VAT return for a company:

```typescript
export function useVATReturn(companyId: string | null) {
  // Query invoices and sum tax_amount
  // Filter by company_id
  // Can optionally filter by date range/fiscal year
  // Return { vatCollected, invoiceCount, isLoading }
}
```

---

#### 2. Update Dashboard - `src/pages/Dashboard.tsx`

Add a new card in the Financial Position section showing:
- **VAT Amount Return** - Total VAT collected from invoices
- Icon and color scheme consistent with other financial cards

Visual representation:
```text
+---------------------------+
| VAT Amount Return         |
| [Receipt Icon]            |
|                           |
| NPR 125,450.00            |
| From 45 invoices          |
+---------------------------+
```

---

#### 3. Update Company Profile - `src/pages/CompanyProfile.tsx`

Add VAT Return information to the CompanyOverview component to show:
- Total VAT collected
- Breakdown by status (paid vs pending invoices)

---

#### 4. Update Company Cards - `src/pages/Companies.tsx`

Add VAT return summary to each company card in the Companies list view.

---

#### 5. Optional: Add Date Range Filter for VAT Calculation

Allow filtering VAT return by:
- Current fiscal year
- Custom date range
- All time

This helps with tax reporting for specific periods.

---

### Files to Create/Modify

| Action | File Path | Description |
|--------|-----------|-------------|
| Create | `src/hooks/useVATReturn.ts` | Hook to calculate VAT from invoices |
| Modify | `src/pages/Dashboard.tsx` | Add VAT Return card to financial position |
| Modify | `src/components/company/profile/CompanyOverview.tsx` | Add VAT info to company profile |
| Modify | `src/pages/Companies.tsx` | Add VAT summary to company cards |

---

### Technical Details

#### VAT Calculation Logic

```typescript
// In useVATReturn.ts
const { data: invoices } = await supabase
  .from('invoices')
  .select('tax_amount, status')
  .eq('company_id', companyId);

const totalVAT = invoices.reduce((sum, inv) => sum + Number(inv.tax_amount), 0);
const paidVAT = invoices
  .filter(inv => inv.status === 'paid')
  .reduce((sum, inv) => sum + Number(inv.tax_amount), 0);
const pendingVAT = totalVAT - paidVAT;
```

#### Dashboard Card Component

```tsx
<Card className="border-border/50 bg-amber-500/5">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      VAT Amount Return
    </CardTitle>
    <Receipt className="h-4 w-4 text-amber-500" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-amber-600">
      {currencySymbol}{vatReturn.toLocaleString()}
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      From {invoiceCount} sales invoices
    </p>
  </CardContent>
</Card>
```

---

### Summary

This implementation will:
- Calculate VAT return dynamically from invoice tax amounts
- Display VAT information on Dashboard, Company Profile, and Company Cards
- Provide visibility into VAT obligations based on sales
- Support both single company and all-companies views
- No database schema changes required (uses existing invoice tax_amount data)

