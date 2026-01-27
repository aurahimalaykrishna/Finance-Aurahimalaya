

# Plan: Bulk Holiday Import and Dedicated Menu Items

## Overview

Add bulk holiday import functionality (from CSV and predefined Nepal public holidays) to the Holiday Management system, and create dedicated sidebar menu items for Holidays and Leave Management for easier access.

---

## Part 1: Dedicated Menu Items

### 1.1 Create Standalone Pages

Create two new dedicated pages that can be accessed directly from the sidebar:

| Page | Route | Description |
|------|-------|-------------|
| Holidays | `/holidays` | Holiday management dashboard (currently embedded in Employees) |
| Leave Requests | `/leave` | Leave approval queue (currently embedded in Employees) |

### 1.2 Update Sidebar Navigation

Add new menu items under the "Main" section:

```text
Main
├── Dashboard
├── Transactions
├── Invoices
├── Customers
├── Categories
├── Budgets
├── Companies
├── Suppliers
├── Employees
├── Holidays       <-- NEW
├── Leave Requests <-- NEW (with pending badge)
├── My Portal
```

---

## Part 2: Predefined Nepal Public Holidays

### 2.1 Nepal Public Holidays Data

Create a data file with Nepal's public holidays for 2082/2083 fiscal year (2025/2026 AD):

| Holiday | Date (AD) | Description |
|---------|-----------|-------------|
| New Year's Day | Jan 1 | International New Year |
| Prithvi Jayanti | Jan 11 | Prithvi Narayan Shah Birthday |
| Maghe Sankranti | Jan 14 | Start of Magh month |
| Basant Panchami | Feb 3 | Saraswati Puja |
| Maha Shivaratri | Feb 26 | Festival of Lord Shiva |
| Fagu Purnima (Holi) | Mar 14 | Festival of Colors |
| Ghode Jatra | Mar 31 | Horse Racing Festival |
| Ram Nawami | Apr 6 | Lord Ram's Birthday |
| Nepali New Year 2082 | Apr 14 | Baisakh 1 |
| Buddha Jayanti | May 12 | Buddha's Birthday |
| Republic Day | May 28 | National Day |
| Janai Purnima | Aug 9 | Sacred Thread Festival |
| Gai Jatra | Aug 10 | Cow Festival |
| Krishna Janmashtami | Aug 16 | Lord Krishna's Birthday |
| Teej | Aug 26 | Women's Festival |
| Indra Jatra | Sep 6 | Chariot Festival |
| Constitution Day | Sep 19 | National Day |
| Ghatasthapana | Sep 22 | Start of Dashain |
| Fulpati | Sep 28 | Dashain Day 7 |
| Maha Ashtami | Sep 29 | Dashain Day 8 |
| Maha Nawami | Sep 30 | Dashain Day 9 |
| Vijaya Dashami | Oct 1 | Dashain Day 10 |
| Tihar (Kukur Tihar) | Oct 20 | Tihar Day 2 |
| Tihar (Laxmi Puja) | Oct 21 | Tihar Day 3 |
| Tihar (Govardhan/Mha Puja) | Oct 22 | Tihar Day 4 |
| Tihar (Bhai Tika) | Oct 23 | Tihar Day 5 |
| Chhath Parva | Oct 28 | Sun Worship Festival |

### 2.2 Quick Import UI

Add a dropdown button next to "Add Holiday" with options:
- Add Single Holiday
- Import from CSV
- Import Nepal 2082/2083 Holidays

```text
+--------------------------------------------------------+
| Company Holidays    [+ Add Holiday ▾] [Import CSV]     |
+--------------------------------------------------------+
|                     ┌─────────────────────────────┐    |
|                     │ Add Single Holiday          │    |
|                     │ ─────────────────────────── │    |
|                     │ Import Nepal 2082/83 (25)   │    |
|                     │ Import Nepal 2083/84 (25)   │    |
|                     └─────────────────────────────┘    |
```

---

## Part 3: CSV Import Dialog

### 3.1 Create ImportHolidaysDialog Component

A dialog for importing holidays from CSV, following the existing ImportTransactionsDialog pattern:

**Supported CSV Format:**
```csv
name,date,description
New Year's Day,2025-01-01,International New Year
Prithvi Jayanti,2025-01-11,Birthday of King Prithvi Narayan Shah
```

**Features:**
- File upload (drag & drop or click)
- Column mapping (auto-detect name/date/description columns)
- Preview with validation
- Duplicate detection (skip holidays on same dates)
- Bulk insert

### 3.2 Column Mapping

| Required | Field | Auto-detect Patterns |
|----------|-------|---------------------|
| Yes | Name | name, holiday, title, event |
| Yes | Date | date, holiday_date, when |
| No | Description | description, notes, details, remarks |

### 3.3 Import Progress

Show progress bar during bulk import with:
- Current/Total count
- Skip duplicates option
- Success/failure summary

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Holidays.tsx` | Dedicated holidays page |
| `src/pages/LeaveRequests.tsx` | Dedicated leave requests page |
| `src/components/holidays/ImportHolidaysDialog.tsx` | CSV import dialog |
| `src/components/holidays/NepalHolidaysPresets.tsx` | Predefined Nepal holidays component |
| `src/data/nepalHolidays.ts` | Nepal public holidays data |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/AppSidebar.tsx` | Add Holidays and Leave menu items |
| `src/App.tsx` | Add routes for /holidays and /leave |
| `src/components/holidays/HolidayManagement.tsx` | Add import buttons and dropdown menu |
| `src/hooks/useCompanyHolidays.ts` | Add bulk create mutation |

---

## Implementation Details

### 3.4 Bulk Create Mutation

Add to `useCompanyHolidays.ts`:

```typescript
const createBulkHolidays = useMutation({
  mutationFn: async (holidays: CreateHolidayData[]) => {
    if (!user) throw new Error('Not authenticated');
    
    const dataWithCreator = holidays.map(h => ({
      ...h,
      created_by: user.id,
    }));
    
    const { data, error } = await supabase
      .from('company_holidays')
      .insert(dataWithCreator)
      .select();
    
    if (error) throw error;
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
    toast({ title: `${data.length} holidays imported successfully` });
  },
});
```

### 3.5 Nepal Holidays Data Structure

```typescript
// src/data/nepalHolidays.ts
export interface NepalHolidayPreset {
  name: string;
  date: string; // YYYY-MM-DD format
  description?: string;
}

export const NEPAL_HOLIDAYS_2082_83: NepalHolidayPreset[] = [
  { name: "New Year's Day", date: "2026-01-01", description: "International New Year" },
  { name: "Prithvi Jayanti", date: "2026-01-11", description: "Birthday of Prithvi Narayan Shah" },
  // ... more holidays
];

export const NEPAL_HOLIDAYS_2083_84: NepalHolidayPreset[] = [
  // Future fiscal year holidays
];
```

---

## UI Components

### Import Dropdown Menu

```text
┌─────────────────────────────┐
│ [Plus] Add Holiday          │
├─────────────────────────────┤
│ [Upload] Import from CSV    │
├─────────────────────────────┤
│ [Flag] Nepal 2082/83 (25)   │
│ [Flag] Nepal 2083/84 (25)   │
└─────────────────────────────┘
```

### Import Preview Table

```text
+----------------------------------------------------------+
| Import Holidays Preview                                   |
+----------------------------------------------------------+
| Found 25 holidays in file. 2 already exist (will skip).  |
|                                                           |
| ☑ Maghe Sankranti     | Jan 14, 2026 | Start of Magh    |
| ☑ Basant Panchami     | Feb 3, 2026  | Saraswati Puja   |
| ☐ Maha Shivaratri     | Feb 26, 2026 | [EXISTS - SKIP]  |
| ☑ Fagu Purnima        | Mar 14, 2026 | Festival of...   |
+----------------------------------------------------------+
|                           [Cancel] [Import 23 Holidays]  |
+----------------------------------------------------------+
```

---

## Sidebar with Badges

The Leave Requests menu item will show a badge with pending count:

```text
├── Holidays
├── Leave Requests (3)  <-- Red badge if pending > 0
```

---

## Implementation Steps

1. **Create Nepal holidays data file** with 2082/83 and 2083/84 fiscal years
2. **Create standalone Holidays page** wrapping HolidayManagement
3. **Create standalone LeaveRequests page** wrapping LeaveRequestsQueue
4. **Add routes** to App.tsx for /holidays and /leave
5. **Update sidebar** with new menu items and pending badge
6. **Add bulk create mutation** to useCompanyHolidays
7. **Create ImportHolidaysDialog** for CSV import
8. **Create NepalHolidaysPresets** for quick import of predefined holidays
9. **Update HolidayManagement** with dropdown menu and import options

---

## Security Notes

- Bulk import uses same RLS policies as single holiday creation
- Only users with owner/admin/hr_manager/accountant roles can import holidays
- Duplicate detection prevents accidental double-imports

---

## Benefits

1. **Quick Setup**: Import all Nepal public holidays in one click
2. **Flexibility**: CSV import for custom holiday lists
3. **Easy Access**: Direct menu links to Holidays and Leave management
4. **Visual Feedback**: Pending leave count badge in sidebar
5. **Data Validation**: Preview and skip duplicates before import

