import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeaveBalanceCard } from '@/components/employees/LeaveBalanceCard';
import { LeaveRequestDialog } from '@/components/portal/LeaveRequestDialog';
import { useEmployeeLeaves } from '@/hooks/useEmployeeLeaves';
import { MyEmployee } from '@/hooks/useMyEmployee';
import { format } from 'date-fns';
import { Plus, FileText, Loader2 } from 'lucide-react';

interface PortalLeaveProps {
  employee: MyEmployee;
}

export function PortalLeave({ employee }: PortalLeaveProps) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { 
    leaveBalance, 
    leaveRequests, 
    isLoading, 
    calculateAvailableLeave, 
    fiscalYear,
    initializeLeaveBalance,
  } = useEmployeeLeaves(employee.id);

  const availableLeave = calculateAvailableLeave(leaveBalance, employee.gender);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Pending</Badge>;
    }
  };

  const getLeaveTypeName = (type: string) => {
    const names: Record<string, string> = {
      home: 'Home Leave',
      sick: 'Sick Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      mourning: 'Mourning Leave',
      public_holiday: 'Public Holiday',
    };
    return names[type] || type;
  };

  // Initialize leave balance if not exists
  const handleInitializeBalance = () => {
    initializeLeaveBalance.mutate({
      employeeId: employee.id,
      dateOfJoin: employee.date_of_join,
      gender: employee.gender,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leave Balances */}
      {availableLeave ? (
        <LeaveBalanceCard
          fiscalYear={fiscalYear}
          availableLeave={availableLeave}
          gender={employee.gender}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Leave balance not initialized for fiscal year {fiscalYear}
            </p>
            <Button onClick={handleInitializeBalance} disabled={initializeLeaveBalance.isPending}>
              {initializeLeaveBalance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initialize Leave Balance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Leave Requests
          </CardTitle>
          <Button size="sm" onClick={() => setShowRequestDialog(true)} disabled={!availableLeave}>
            <Plus className="h-4 w-4 mr-2" />
            Apply Leave
          </Button>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No leave requests found. Click "Apply Leave" to submit a new request.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {getLeaveTypeName(request.leave_type)}
                    </TableCell>
                    <TableCell>{format(new Date(request.start_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(request.end_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{request.days_requested}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Leave Request Dialog */}
      <LeaveRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        employee={employee}
        availableLeave={availableLeave}
        companyId={employee.company_id}
      />
    </div>
  );
}
