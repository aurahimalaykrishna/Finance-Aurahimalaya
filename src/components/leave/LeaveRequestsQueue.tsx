import { useState } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAllLeaveRequests, LeaveRequestWithEmployee } from '@/hooks/useAllLeaveRequests';
import { useCompanyHolidays } from '@/hooks/useCompanyHolidays';
import { useEmployeeLeaves } from '@/hooks/useEmployeeLeaves';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { LeaveApprovalDialog } from './LeaveApprovalDialog';
import { CheckCircle, XCircle, AlertTriangle, Clock, Calendar } from 'lucide-react';

const leaveTypeLabels: Record<string, string> = {
  home: 'Home Leave',
  sick: 'Sick Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  mourning: 'Mourning Leave',
  public_holiday: 'Public Holiday',
};

export function LeaveRequestsQueue() {
  const { user } = useAuth();
  const { selectedCompany } = useCompanyContext();
  const companyId = selectedCompany?.id;

  const {
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    isLoading,
    refetch,
  } = useAllLeaveRequests(companyId);

  const { holidays } = useCompanyHolidays(companyId);
  const { updateLeaveRequestStatus } = useEmployeeLeaves();

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithEmployee | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject'>('approve');
  const [dialogOpen, setDialogOpen] = useState(false);

  const getOverlappingHolidays = (request: LeaveRequestWithEmployee) => {
    const startDate = parseISO(request.start_date);
    const endDate = parseISO(request.end_date);

    return holidays.filter((h) => {
      const holidayDate = parseISO(h.date);
      return isWithinInterval(holidayDate, { start: startDate, end: endDate });
    });
  };

  const handleApprove = (request: LeaveRequestWithEmployee) => {
    setSelectedRequest(request);
    setDialogAction('approve');
    setDialogOpen(true);
  };

  const handleReject = (request: LeaveRequestWithEmployee) => {
    setSelectedRequest(request);
    setDialogAction('reject');
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedRequest || !user) return;

    await updateLeaveRequestStatus.mutateAsync({
      requestId: selectedRequest.id,
      status: dialogAction === 'approve' ? 'approved' : 'rejected',
      approverId: user.id,
    });

    refetch();
  };

  if (!companyId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Please select a company to view leave requests.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading leave requests...
        </CardContent>
      </Card>
    );
  }

  const RequestCard = ({ request }: { request: LeaveRequestWithEmployee }) => {
    const overlappingHolidays = getOverlappingHolidays(request);
    const isPending = request.status === 'pending';

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{request.employee.full_name}</span>
                {request.employee.department && (
                  <Badge variant="outline" className="text-xs">
                    {request.employee.department}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {leaveTypeLabels[request.leave_type] || request.leave_type}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4" />
                {format(new Date(request.start_date), 'MMM d')} -{' '}
                {format(new Date(request.end_date), 'MMM d, yyyy')}
              </div>
              <div className="text-sm text-muted-foreground">
                {request.days_requested} day(s)
              </div>
            </div>
          </div>

          {request.reason && (
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>Reason:</strong> {request.reason}
            </p>
          )}

          {overlappingHolidays.length > 0 && (
            <Alert className="mt-3 bg-yellow-500/10 border-yellow-500/50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                Overlaps with: {overlappingHolidays.map((h) => h.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {isPending && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleReject(request)}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
              <Button size="sm" onClick={() => handleApprove(request)}>
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve
              </Button>
            </div>
          )}

          {!isPending && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              {request.status === 'approved' ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Approved
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3 w-3" />
                  Rejected
                </Badge>
              )}
              {request.approved_at && (
                <span className="text-muted-foreground">
                  on {format(new Date(request.approved_at), 'PPP')}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8 text-muted-foreground">
      <Clock className="mx-auto h-12 w-12 opacity-50 mb-2" />
      <p>{message}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            Review and manage employee leave requests for {selectedCompany?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingRequests.length === 0 ? (
                <EmptyState message="No pending leave requests" />
              ) : (
                pendingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              {approvedRequests.length === 0 ? (
                <EmptyState message="No approved leave requests" />
              ) : (
                approvedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {rejectedRequests.length === 0 ? (
                <EmptyState message="No rejected leave requests" />
              ) : (
                rejectedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LeaveApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selectedRequest}
        action={dialogAction}
        onConfirm={handleConfirm}
        isLoading={updateLeaveRequestStatus.isPending}
      />
    </div>
  );
}
