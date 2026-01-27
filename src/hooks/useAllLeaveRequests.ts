import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaveRequestWithEmployee {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  employee: {
    id: string;
    full_name: string;
    employee_code: string | null;
    department: string | null;
    gender: string;
  };
}

export function useAllLeaveRequests(companyId?: string) {
  const { data: leaveRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['all-leave-requests', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('employee_leave_requests')
        .select(`
          *,
          employee:employees!inner(
            id,
            full_name,
            employee_code,
            department,
            gender,
            company_id
          )
        `)
        .eq('employee.company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((item: Record<string, unknown>) => ({
        ...item,
        employee: item.employee as LeaveRequestWithEmployee['employee'],
      })) as LeaveRequestWithEmployee[];
    },
    enabled: !!companyId,
  });

  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');
  const approvedRequests = leaveRequests.filter((r) => r.status === 'approved');
  const rejectedRequests = leaveRequests.filter((r) => r.status === 'rejected');

  // Check for leave conflicts during a date range
  const checkLeaveConflicts = async (
    startDate: string,
    endDate: string,
    excludeEmployeeId?: string
  ): Promise<LeaveRequestWithEmployee[]> => {
    if (!companyId) return [];

    const { data, error } = await supabase
      .from('employee_leave_requests')
      .select(`
        *,
        employee:employees!inner(
          id,
          full_name,
          employee_code,
          department,
          gender,
          company_id
        )
      `)
      .eq('employee.company_id', companyId)
      .eq('status', 'approved')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (error) {
      console.error('Error checking leave conflicts:', error);
      return [];
    }

    const conflicts = (data || [])
      .filter((item: Record<string, unknown>) => {
        if (excludeEmployeeId && (item.employee as { id: string }).id === excludeEmployeeId) {
          return false;
        }
        return true;
      })
      .map((item: Record<string, unknown>) => ({
        ...item,
        employee: item.employee as LeaveRequestWithEmployee['employee'],
      })) as LeaveRequestWithEmployee[];

    return conflicts;
  };

  return {
    leaveRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    pendingCount: pendingRequests.length,
    isLoading,
    refetch,
    checkLeaveConflicts,
  };
}
