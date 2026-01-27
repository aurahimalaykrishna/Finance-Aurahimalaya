
# Plan: Enhanced Holiday Calendar and Leave Management System

## Overview

Implement a comprehensive holiday calendar management system for admins and enhance the leave management workflow with a dedicated manager approval queue. This builds upon the existing `useCompanyHolidays` hook and `useEmployeeLeaves` system, adding missing admin interfaces and validation features.

---

## Current System Analysis

### What Already Exists

| Feature | Status | Location |
|---------|--------|----------|
| Holiday CRUD operations | Backend ready | `useCompanyHolidays.ts` |
| Employee holiday view | Complete | `PortalHolidays.tsx` |
| Leave types (Home, Sick, Maternity, Paternity, Mourning) | Defined | `nepal-hr-calculations.ts` |
| Leave balance tracking | Complete | `employee_leave_balances` table |
| Leave request submission | Complete | `LeaveRequestDialog.tsx` |
| Leave approval logic | Backend ready | `useEmployeeLeaves.ts` |
| Balance validation | Partial | Prevents over-requesting |

### What Needs to Be Added

1. **Admin Holiday Management Dashboard** - Add/edit/delete holidays with calendar view
2. **Manager Leave Approval Queue** - Dedicated UI for pending requests
3. **Holiday Overlap Validation** - Warn when leave overlaps with company holidays
4. **Leave Overlap Detection** - Check for conflicts with other employees' approved leave

---

## Part 1: Holiday Calendar Management (Admin)

### 1.1 Create HolidayDialog Component

A dialog for adding and editing holidays.

```
+------------------------------------------+
| Add Holiday                              |
+------------------------------------------+
| Name: [____________________________]     |
|                                          |
| Date: [Calendar Picker________] [v]     |
|                                          |
| Description (optional):                  |
| [________________________________]       |
| [________________________________]       |
|                                          |
|                      [Cancel] [Save]     |
+------------------------------------------+
```

**Properties:**
- `open` - Dialog visibility
- `onOpenChange` - Toggle callback
- `holiday` - Existing holiday for editing (null for new)
- `companyId` - Target company ID
- `onSave` - Callback on successful save

### 1.2 Create HolidayCalendar Component

A visual calendar showing all holidays with month navigation.

**Features:**
- Month/year navigation
- Holidays highlighted on calendar dates
- Click date to add holiday
- Click existing holiday to edit/delete
- Color-coded by proximity (today, this week, upcoming)

### 1.3 Create HolidayManagement Component

Main container component for the admin holiday dashboard.

```
+--------------------------------------------------------+
| Company Holidays                      [+ Add Holiday]   |
+--------------------------------------------------------+
| [Upcoming] [Calendar View] [All Holidays]              |
|                                                         |
| +---------------------------------------------------+  |
| |          << January 2026 >>                       |  |
| | Su  Mo  Tu  We  Th  Fr  Sa                       |  |
| |                 1   2   3   4                     |  |
| |  5   6   7   8   9  10  11                       |  |
| | 12  13  14 [15] 16  17  18   <- Holiday marked   |  |
| | 19  20  21  22  23  24  25                       |  |
| | 26  27  28  29  30  31                           |  |
| +---------------------------------------------------+  |
|                                                         |
| Upcoming Holidays:                                      |
| +---------------------------------------------------+  |
| | Maghe Sankranti        | Jan 15, 2026  | [Edit]  |  |
| | Prithvi Jayanti        | Jan 11, 2026  | [Edit]  |  |
| +---------------------------------------------------+  |
+--------------------------------------------------------+
```

### 1.4 Add Holiday Tab to Employees Page

Integrate the HolidayManagement component as a new tab in the Employees page.

```typescript
// Add to Employees.tsx TabsList
<TabsTrigger value="holidays" className="flex items-center gap-2">
  <CalendarDays className="h-4 w-4" />
  Holidays
</TabsTrigger>
```

---

## Part 2: Leave Approval Queue (Manager/Admin)

### 2.1 Create useAllLeaveRequests Hook

Fetch all pending leave requests for the company (for managers/admins).

```typescript
export function useAllLeaveRequests(companyId?: string) {
  // Fetches leave requests with employee details
  // Joins employee_leave_requests with employees table
  // Filters by company_id
  // Returns requests sorted by created_at (newest first)
}
```

### 2.2 Create LeaveRequestsQueue Component

A dedicated component for managers to view and action pending requests.

```
+--------------------------------------------------------+
| Leave Requests                         [Filter: All v] |
+--------------------------------------------------------+
| Pending (3) | Approved | Rejected                      |
+--------------------------------------------------------+
|                                                         |
| +---------------------------------------------------+  |
| | Ram Sharma - Home Leave                           |  |
| | Jan 20-22, 2026 (3 days)                         |  |
| | Reason: Family function                           |  |
| | Balance: 12 days remaining                        |  |
| |                         [Reject] [Approve]        |  |
| +---------------------------------------------------+  |
|                                                         |
| +---------------------------------------------------+  |
| | Sita Devi - Sick Leave                [WARNING]  |  |
| | Jan 15-16, 2026 (2 days)                         |  |
| | Warning: Overlaps with Maghe Sankranti holiday   |  |
| |                         [Reject] [Approve]        |  |
| +---------------------------------------------------+  |
|                                                         |
+--------------------------------------------------------+
```

**Features:**
- Tab filtering by status (Pending/Approved/Rejected)
- Employee name and leave details
- Warning badges for overlaps
- Approve/Reject buttons with optional comment
- Shows remaining balance for leave type

### 2.3 Create LeaveApprovalDialog Component

Dialog for approving/rejecting with optional comments.

```
+------------------------------------------+
| Approve Leave Request                    |
+------------------------------------------+
| Employee: Ram Sharma                     |
| Type: Home Leave                         |
| Dates: Jan 20-22, 2026 (3 days)         |
|                                          |
| Comment (optional):                      |
| [________________________________]       |
|                                          |
|                   [Cancel] [Approve]     |
+------------------------------------------+
```

### 2.4 Add Leave Requests Tab to Employees Page

Add a new tab for leave management in the Employees page.

```typescript
<TabsTrigger value="leave-requests" className="flex items-center gap-2">
  <FileText className="h-4 w-4" />
  Leave Requests
  {pendingCount > 0 && (
    <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>
  )}
</TabsTrigger>
```

---

## Part 3: Enhanced Validation

### 3.1 Holiday Overlap Detection

Update LeaveRequestDialog to check for holiday conflicts.

```typescript
// In LeaveRequestDialog
const overlappingHolidays = holidays.filter(h => {
  const holidayDate = new Date(h.date);
  return holidayDate >= startDate && holidayDate <= endDate;
});

// Show warning if overlaps found
{overlappingHolidays.length > 0 && (
  <Alert variant="warning">
    <AlertTitle>Holiday Overlap</AlertTitle>
    <AlertDescription>
      Your request includes {overlappingHolidays.map(h => h.name).join(', ')}
    </AlertDescription>
  </Alert>
)}
```

### 3.2 Leave Conflict Detection

Check if other employees have approved leave during the same period.

```typescript
// New function in useAllLeaveRequests
async function checkLeaveConflicts(
  companyId: string, 
  startDate: string, 
  endDate: string, 
  excludeEmployeeId?: string
): Promise<ConflictingLeave[]>
```

### 3.3 Update Leave Request Submission

Add validation warnings before submission:

1. Check available balance (already exists)
2. Check holiday overlaps (new)
3. Check team conflicts (new - informational only)

---

## Part 4: Permission Integration

### 4.1 Role-Based Access

Integrate with existing permission system:

| Action | Allowed Roles |
|--------|---------------|
| View holiday calendar | All |
| Add/edit/delete holidays | Owner, Admin, HR Manager, Accountant |
| View own leave requests | All (via Employee Portal) |
| View all leave requests | Owner, Admin, HR Manager, Manager, Supervisor |
| Approve/reject leave | Owner, Admin, HR Manager, Manager, Supervisor |

### 4.2 PermissionGate Usage

```typescript
<PermissionGate requires={['approve_leave']}>
  <LeaveRequestsQueue />
</PermissionGate>
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/holidays/HolidayDialog.tsx` | Add/edit holiday form |
| `src/components/holidays/HolidayCalendar.tsx` | Visual calendar display |
| `src/components/holidays/HolidayManagement.tsx` | Main holiday admin container |
| `src/components/leave/LeaveRequestsQueue.tsx` | Manager approval queue |
| `src/components/leave/LeaveApprovalDialog.tsx` | Approve/reject dialog |
| `src/hooks/useAllLeaveRequests.ts` | Fetch company leave requests |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Employees.tsx` | Add Holidays and Leave Requests tabs |
| `src/components/portal/LeaveRequestDialog.tsx` | Add holiday overlap warnings |
| `src/hooks/useCompanyHolidays.ts` | Add helper for date range overlap check |

---

## Implementation Steps

### Phase 1: Holiday Management
1. Create HolidayDialog component for add/edit
2. Create HolidayCalendar visual component
3. Create HolidayManagement container
4. Add Holidays tab to Employees page

### Phase 2: Leave Approval Queue
5. Create useAllLeaveRequests hook
6. Create LeaveRequestsQueue component
7. Create LeaveApprovalDialog component
8. Add Leave Requests tab to Employees page

### Phase 3: Validation Enhancements
9. Add holiday overlap detection to LeaveRequestDialog
10. Add conflict detection helper functions
11. Display warnings in both employee and manager views

---

## UI Flow Diagrams

### Admin Holiday Management

```text
+------------------+     +------------------+
| Employees Page   | --> | Holidays Tab     |
+------------------+     +------------------+
                               |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
+---------------+      +---------------+      +---------------+
| Calendar View |      | List View     |      | Add Holiday   |
| (Month Grid)  |      | (Upcoming)    |      | Dialog        |
+---------------+      +---------------+      +---------------+
        |                      |
        v                      v
+------------------------------------------+
| Click holiday -> Edit/Delete Dialog      |
+------------------------------------------+
```

### Manager Leave Approval

```text
+------------------+     +----------------------+
| Employees Page   | --> | Leave Requests Tab   |
+------------------+     +----------------------+
                               |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
+---------------+      +---------------+      +---------------+
| Pending       |      | Approved      |      | Rejected      |
| Requests      |      | History       |      | History       |
+---------------+      +---------------+      +---------------+
        |
        v
+------------------------------------------+
| Click Approve/Reject -> Confirmation     |
| - Optional comment                       |
| - Creates attendance_logs if approved    |
| - Updates leave balance                  |
+------------------------------------------+
```

---

## Security Considerations

- Holiday management restricted via RLS (owner, admin, accountant roles)
- Leave approval checks `has_company_access` and role permissions
- All mutations validate user authentication
- Sensitive employee data only visible to authorized roles

---

## Benefits After Implementation

1. **For Admins**: Centralized dashboard to manage company holidays with visual calendar
2. **For Managers**: Dedicated queue to review and action pending leave requests
3. **For Employees**: Clear visibility of holidays when applying for leave
4. **For System**: Automatic conflict detection prevents scheduling issues
5. **Compliance**: Proper tracking of leave balances per Nepal Labour Act requirements
