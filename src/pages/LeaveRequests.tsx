import { LeaveRequestsQueue } from '@/components/leave/LeaveRequestsQueue';
import { useCompanyContext } from '@/contexts/CompanyContext';

export default function LeaveRequests() {
  const { selectedCompany } = useCompanyContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        <p className="text-muted-foreground">
          Manage leave requests for {selectedCompany?.name || 'your company'}
        </p>
      </div>
      
      <LeaveRequestsQueue />
    </div>
  );
}
