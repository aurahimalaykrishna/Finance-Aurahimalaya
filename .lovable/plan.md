
# Plan: Leave CRUD Enhancement

## Overview

Add complete CRUD operations for leave requests, allowing employees to edit and cancel their pending requests, while managers have full control over all requests.

---

## Current State Analysis

| Operation | Employee (Portal) | Manager (Admin) |
|-----------|-------------------|-----------------|
| **Create** | Can submit leave requests | N/A |
| **Read** | Can view own requests | Can view all company requests |
| **Update** | NOT AVAILABLE | Approve/Reject only |
| **Delete/Cancel** | NOT AVAILABLE | Can delete any request |

---

## What Needs to Be Added

### For Employees (Portal)

1. **Cancel Pending Request** - Button to withdraw a pending leave request
2. **Edit Pending Request** - Modify dates/type/reason of pending requests
3. **View Request Details** - Expand row to see full details including reason

### For Managers (Leave Requests Page)

1. **Delete Request** - Remove any leave request (not just approve/reject)
2. **View Full History** - See all requests with search/filter capabilities

---

## Part 1: Database Changes

### 1.1 Add RLS Policy for Employee Self-Update

Allow employees to update their own pending requests:

```sql
CREATE POLICY "Employees can update own pending leave requests"
ON public.employee_leave_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_leave_requests.employee_id 
    AND e.user_id = auth.uid()
  )
  AND status = 'pending'
);
```

This ensures:
- Employees can only update their OWN requests
- Only PENDING requests can be modified
- Once approved/rejected, employees cannot change them

---

## Part 2: Hook Enhancements

### 2.1 Update useEmployeeLeaves.ts

Add new mutations:

| Mutation | Purpose |
|----------|---------|
| `cancelLeaveRequest` | Employee cancels their pending request |
| `updateLeaveRequest` | Employee edits dates/type/reason |
| `deleteLeaveRequest` | Manager permanently deletes a request |

```typescript
// Cancel mutation (employee)
const cancelLeaveRequest = useMutation({
  mutationFn: async (requestId: string) => {
    const { error } = await supabase
      .from('employee_leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('status', 'pending'); // Safety: only cancel if still pending
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['employee-leave-requests'] });
    toast({ title: 'Leave request cancelled' });
  },
});

// Update mutation (employee)
const updateLeaveRequest = useMutation({
  mutationFn: async (data: UpdateLeaveRequestData) => {
    const { error } = await supabase
      .from('employee_leave_requests')
      .update({
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        days_requested: data.days_requested,
        reason: data.reason,
      })
      .eq('id', data.id)
      .eq('status', 'pending');
    if (error) throw error;
  },
});

// Delete mutation (manager)
const deleteLeaveRequest = useMutation({
  mutationFn: async (requestId: string) => {
    const { error } = await supabase
      .from('employee_leave_requests')
      .delete()
      .eq('id', requestId);
    if (error) throw error;
  },
});
```

---

## Part 3: Employee Portal UI

### 3.1 Update PortalLeave.tsx

Add action buttons to the leave request table:

```text
+----------------------------------------------------------------+
| My Leave Requests                           [+ Apply Leave]    |
+----------------------------------------------------------------+
| Type         | From       | To         | Days | Status | Actions |
|--------------|------------|------------|------|--------|---------|
| Home Leave   | Jan 20     | Jan 22     | 3    | Pending| [Edit] [Cancel] |
| Sick Leave   | Dec 15     | Dec 16     | 2    | Approved |        |
| Home Leave   | Nov 10     | Nov 11     | 2    | Rejected |        |
+----------------------------------------------------------------+
```

**Actions visible only for pending requests:**
- Edit button (opens dialog with pre-filled values)
- Cancel button (opens confirmation dialog)

### 3.2 Create CancelLeaveDialog Component

A simple confirmation dialog for canceling requests:

```text
+------------------------------------------+
| Cancel Leave Request?                    |
+------------------------------------------+
| Are you sure you want to cancel this     |
| leave request?                           |
|                                          |
| Home Leave: Jan 20-22, 2026 (3 days)    |
|                                          |
|                   [Keep] [Cancel Request]|
+------------------------------------------+
```

### 3.3 Update LeaveRequestDialog for Edit Mode

Modify the existing dialog to support editing:
- Accept optional `existingRequest` prop
- Pre-fill form fields when editing
- Change button text from "Submit Request" to "Update Request"
- Use `updateLeaveRequest` mutation when in edit mode

---

## Part 4: Manager UI Enhancements

### 4.1 Update LeaveRequestsQueue.tsx

Add delete action for managers:

```text
+---------------------------------------------------+
| Ram Sharma - Home Leave                           |
| Jan 20-22, 2026 (3 days)                         |
|                         [Delete] [Reject] [Approve]|
+---------------------------------------------------+
```

Add for approved/rejected requests:
- Delete button to permanently remove records
- Useful for cleanup or data corrections

### 4.2 Create DeleteLeaveDialog Component

Confirmation dialog for permanent deletion:

```text
+------------------------------------------+
| Delete Leave Request?                    |
+------------------------------------------+
| This will permanently delete this leave  |
| request. This action cannot be undone.   |
|                                          |
| Employee: Ram Sharma                     |
| Type: Home Leave                         |
| Status: Approved                         |
|                                          |
|                      [Cancel] [Delete]   |
+------------------------------------------+
```

---

## Part 5: Request Details View

### 5.1 Create LeaveRequestDetailDialog

Show full details when clicking on a request:

```text
+------------------------------------------+
| Leave Request Details                    |
+------------------------------------------+
| Employee: Ram Sharma                     |
| Department: Engineering                  |
| Type: Home Leave                         |
| Dates: Jan 20-22, 2026 (3 days)         |
| Status: Approved                         |
| Approved By: Manager Name                |
| Approved On: Jan 18, 2026               |
|                                          |
| Reason:                                  |
| Family function in hometown              |
|                                          |
| Applied On: Jan 15, 2026                |
+------------------------------------------+
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/portal/CancelLeaveDialog.tsx` | Confirm cancel for employees |
| `src/components/leave/DeleteLeaveDialog.tsx` | Confirm delete for managers |
| `src/components/leave/LeaveRequestDetailDialog.tsx` | View full request details |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useEmployeeLeaves.ts` | Add cancel, update, delete mutations |
| `src/components/portal/PortalLeave.tsx` | Add action buttons, edit/cancel dialogs |
| `src/components/portal/LeaveRequestDialog.tsx` | Support edit mode with existing request |
| `src/components/leave/LeaveRequestsQueue.tsx` | Add delete button, detail view |

---

## Database Migration

Add RLS policy to allow employees to update/cancel their own pending requests:

```sql
-- Allow employees to update their own PENDING leave requests only
CREATE POLICY "Employees can update own pending leave requests"
ON public.employee_leave_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_leave_requests.employee_id 
    AND e.user_id = auth.uid()
  )
  AND status = 'pending'
);
```

---

## Implementation Steps

1. **Database**: Add RLS policy for employee self-update
2. **Hooks**: Add cancel, update, delete mutations to useEmployeeLeaves
3. **Employee UI**: 
   - Create CancelLeaveDialog component
   - Update LeaveRequestDialog for edit mode
   - Update PortalLeave with action buttons
4. **Manager UI**:
   - Create DeleteLeaveDialog component
   - Create LeaveRequestDetailDialog component
   - Update LeaveRequestsQueue with delete action

---

## UI Flow

### Employee Canceling a Request

```text
PortalLeave Table
      ↓
Click "Cancel" button (pending row)
      ↓
CancelLeaveDialog opens
      ↓
Confirm → cancelLeaveRequest mutation
      ↓
Status changes to "cancelled"
```

### Employee Editing a Request

```text
PortalLeave Table
      ↓
Click "Edit" button (pending row)
      ↓
LeaveRequestDialog opens (edit mode)
      ↓
Modify fields → Submit
      ↓
updateLeaveRequest mutation
      ↓
Request updated
```

### Manager Deleting a Request

```text
LeaveRequestsQueue
      ↓
Click "Delete" button (any request)
      ↓
DeleteLeaveDialog opens
      ↓
Confirm → deleteLeaveRequest mutation
      ↓
Request permanently removed
```

---

## Security Considerations

- Employees can ONLY modify their OWN pending requests
- Once approved/rejected, employees cannot change requests
- Managers with `has_company_access` can update/delete any request
- All mutations are protected by RLS policies
- Status transitions are validated in the mutation logic

---

## Benefits

1. **For Employees**: Full control over pending requests (edit dates, cancel)
2. **For Managers**: Clean up old/incorrect requests with delete action
3. **Better UX**: View full request details without navigating away
4. **Data Integrity**: RLS ensures proper access control at database level
