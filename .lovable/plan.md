

# Plan: Transaction Category Statistics

## Overview

Add a statistics section to the Transactions page showing a summary of categorized vs. uncategorized transactions. This will help users quickly identify how many transactions need categorization and the financial totals for each group.

---

## Current State

The Transactions page currently shows:
- A search bar, type filter, and date range picker
- Import/Export buttons and Add Transaction dialog
- A table with all transactions

There is no visual summary showing categorization status. Users must scroll through the table to identify uncategorized transactions.

---

## What We Will Build

A compact statistics bar above the transaction table showing:

```text
+-------------------------------------------------------------------------+
| Transactions Summary                                                     |
+-------------------------------------------------------------------------+
| 📊 Total: 156        ✅ Categorized: 142 (91%)     ⚠️ Uncategorized: 14  |
|    NPR 2,450,000        NPR 2,180,000                 NPR 270,000        |
+-------------------------------------------------------------------------+
```

### Features:

1. **Total Transactions Count** - Shows total count and sum
2. **Categorized Count** - Transactions with a category linked, showing count, percentage, and amount
3. **Uncategorized Count** - Transactions without categories, with a warning indicator and clickable filter
4. **Click-to-filter** - Clicking "Uncategorized" will filter the table to show only those transactions

---

## UI Design

### Stats Bar Layout

```text
+-------------------+-------------------+-------------------+
| Total             | Categorized       | Uncategorized     |
| 156 transactions  | 142 (91.0%)       | 14 (9.0%)         |
| NPR 2,450,000     | NPR 2,180,000     | NPR 270,000       |
|                   | ✓ green badge     | ⚠️ orange/red     |
+-------------------+-------------------+-------------------+
```

### Component Styling

- Uses the same Card component with grid layout (similar to Dashboard summary cards)
- Color coding:
  - **Total**: Neutral/primary color
  - **Categorized**: Green success color
  - **Uncategorized**: Orange warning color (or red if percentage is high)
- Clickable uncategorized card to filter the transaction list
- Responsive: 3 columns on desktop, stacks on mobile

---

## Implementation Details

### 1. Calculate Statistics (useMemo)

Add to `src/pages/Transactions.tsx`:

```typescript
const categoryStats = useMemo(() => {
  const total = filteredTransactions.length;
  const categorized = filteredTransactions.filter(t => t.category_id !== null);
  const uncategorized = filteredTransactions.filter(t => t.category_id === null);
  
  const categorizedAmount = categorized.reduce((sum, t) => sum + Number(t.amount), 0);
  const uncategorizedAmount = uncategorized.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalAmount = categorizedAmount + uncategorizedAmount;
  
  return {
    total,
    totalAmount,
    categorizedCount: categorized.length,
    categorizedAmount,
    categorizedPercentage: total > 0 ? (categorized.length / total * 100).toFixed(1) : '0',
    uncategorizedCount: uncategorized.length,
    uncategorizedAmount,
    uncategorizedPercentage: total > 0 ? (uncategorized.length / total * 100).toFixed(1) : '0',
  };
}, [filteredTransactions]);
```

### 2. Add Category Filter State

```typescript
const [categoryFilter, setCategoryFilter] = useState<'all' | 'categorized' | 'uncategorized'>('all');
```

### 3. Update Filtering Logic

Modify the existing `filteredTransactions` useMemo to include category filter:

```typescript
const filteredTransactions = useMemo(() => {
  return transactions.filter(t => {
    // ... existing filters ...
    
    // Category filter
    let matchesCategory = true;
    if (categoryFilter === 'categorized') {
      matchesCategory = t.category_id !== null;
    } else if (categoryFilter === 'uncategorized') {
      matchesCategory = t.category_id === null;
    }
    
    return matchesSearch && matchesType && matchesDate && matchesCategory;
  });
}, [transactions, search, typeFilter, dateRange, categoryFilter]);
```

### 4. Stats Bar UI Component

Add the stats section between the filters and the table:

```tsx
{/* Category Statistics */}
<div className="grid gap-4 md:grid-cols-3">
  <Card 
    className={cn(
      "border-border/50 cursor-pointer transition-all",
      categoryFilter === 'all' && "ring-2 ring-primary"
    )}
    onClick={() => setCategoryFilter('all')}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Total Transactions</span>
        <BarChart3 className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{categoryStats.total}</div>
        <p className="text-sm text-muted-foreground">
          {currencySymbol}{categoryStats.totalAmount.toLocaleString()}
        </p>
      </div>
    </CardContent>
  </Card>
  
  <Card 
    className={cn(
      "border-border/50 cursor-pointer transition-all",
      categoryFilter === 'categorized' && "ring-2 ring-success"
    )}
    onClick={() => setCategoryFilter('categorized')}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Categorized</span>
        <CheckCircle2 className="h-4 w-4 text-success" />
      </div>
      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-success">{categoryStats.categorizedCount}</span>
          <span className="text-sm text-muted-foreground">({categoryStats.categorizedPercentage}%)</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {currencySymbol}{categoryStats.categorizedAmount.toLocaleString()}
        </p>
      </div>
    </CardContent>
  </Card>
  
  <Card 
    className={cn(
      "border-border/50 cursor-pointer transition-all",
      categoryFilter === 'uncategorized' && "ring-2 ring-orange-500",
      categoryStats.uncategorizedCount > 0 && "bg-orange-500/5"
    )}
    onClick={() => setCategoryFilter('uncategorized')}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Uncategorized</span>
        <AlertCircle className="h-4 w-4 text-orange-500" />
      </div>
      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-orange-500">{categoryStats.uncategorizedCount}</span>
          <span className="text-sm text-muted-foreground">({categoryStats.uncategorizedPercentage}%)</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {currencySymbol}{categoryStats.uncategorizedAmount.toLocaleString()}
        </p>
      </div>
    </CardContent>
  </Card>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Transactions.tsx` | Add category stats calculation, filter state, stats bar UI |

---

## Additional Considerations

### Clear Filter Button

When a category filter is active, show a clear button in the filter bar:

```tsx
{categoryFilter !== 'all' && (
  <Button variant="ghost" size="sm" onClick={() => setCategoryFilter('all')}>
    <X className="h-4 w-4 mr-1" /> Clear category filter
  </Button>
)}
```

### Statistics Respect Current Filters

The statistics should be calculated from `filteredTransactions` (after type, date, and search filters are applied) so they reflect the currently visible data set. This gives contextual stats like "Of the 50 expense transactions in January, 45 are categorized."

### Visual Hierarchy

- Stats cards use smaller typography than Dashboard cards since this is secondary information
- Cards are clickable with hover states to indicate interactivity
- Active filter card gets a ring indicator matching its color

---

## Summary

This implementation adds a clean, clickable statistics summary above the transaction table that:

1. Shows total, categorized, and uncategorized transaction counts with amounts
2. Allows one-click filtering to see only uncategorized transactions
3. Uses consistent styling with the rest of the application
4. Respects existing filters (type, date range, search) for contextual statistics

