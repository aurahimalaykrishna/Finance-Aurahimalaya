import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentFiscalYear,
  calculateHomeLeaveAccrual,
  calculateSickLeaveAccrual,
  getPublicHolidayEntitlement,
  PATERNITY_LEAVE_DAYS,
  MOURNING_LEAVE_DAYS,
  MATERNITY_PAID_DAYS,
} from '@/lib/nepal-hr-calculations';
import { CompanyLeaveType } from '@/hooks/useCompanyLeaveTypes';
import { differenceInMonths, differenceInDays, eachDayOfInterval, format } from 'date-fns';

export interface LeaveBalance {
  id: string;
  employee_id: string;
  fiscal_year: string;
  home_leave_accrued: number;
  home_leave_used: number;
  sick_leave_accrued: number;
  sick_leave_used: number;
  maternity_leave_used: number;
  paternity_leave_used: number;
  mourning_leave_used: number;
  public_holidays_used: number;
  home_leave_carried_forward: number;
  sick_leave_carried_forward: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'home' | 'sick' | 'maternity' | 'paternity' | 'mourning' | 'public_holiday';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface CreateLeaveRequestData {
  employee_id: string;
  leave_type: 'home' | 'sick' | 'maternity' | 'paternity' | 'mourning' | 'public_holiday';
  start_date: string;
  end_date: string;
  reason?: string;
}

export function useEmployeeLeaves(employeeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fiscalYear = getCurrentFiscalYear();

  const { data: leaveBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['employee-leave-balance', employeeId, fiscalYear],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('employee_leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('fiscal_year', fiscalYear)
        .maybeSingle();

      if (error) throw error;
      return data as LeaveBalance | null;
    },
    enabled: !!employeeId,
  });

  const { data: leaveRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['employee-leave-requests', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('employee_leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeaveRequest[];
    },
    enabled: !!employeeId,
  });

  // Initialize leave balance for a new fiscal year
  const initializeLeaveBalance = useMutation({
    mutationFn: async ({ 
      employeeId, 
      dateOfJoin, 
      gender,
      carryForwardHome = 0,
      carryForwardSick = 0,
    }: { 
      employeeId: string; 
      dateOfJoin: string;
      gender: string;
      carryForwardHome?: number;
      carryForwardSick?: number;
    }) => {
      const joinDate = new Date(dateOfJoin);
      const now = new Date();
      const monthsWorked = Math.max(0, differenceInMonths(now, joinDate));
      const workingDays = Math.max(0, differenceInDays(now, joinDate));

      const { data, error } = await supabase
        .from('employee_leave_balances')
        .insert({
          employee_id: employeeId,
          fiscal_year: fiscalYear,
          home_leave_accrued: calculateHomeLeaveAccrual(workingDays),
          sick_leave_accrued: calculateSickLeaveAccrual(monthsWorked),
          home_leave_carried_forward: carryForwardHome,
          sick_leave_carried_forward: carryForwardSick,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-leave-balance'] });
      toast({ title: 'Leave balance initialized' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error initializing leave balance', description: error.message, variant: 'destructive' });
    },
  });

  // Create leave request
  const createLeaveRequest = useMutation({
    mutationFn: async (data: CreateLeaveRequestData) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const { data: request, error } = await supabase
        .from('employee_leave_requests')
        .insert({
          employee_id: data.employee_id,
          leave_type: data.leave_type,
          start_date: data.start_date,
          end_date: data.end_date,
          days_requested: daysRequested,
          reason: data.reason,
        })
        .select()
        .single();

      if (error) throw error;
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-leave-requests'] });
      toast({ title: 'Leave request submitted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error submitting leave request', description: error.message, variant: 'destructive' });
    },
  });

  // Approve/reject leave request
  const updateLeaveRequestStatus = useMutation({
    mutationFn: async ({ 
      requestId, 
      status, 
      approverId 
    }: { 
      requestId: string; 
      status: 'approved' | 'rejected' | 'cancelled';
      approverId: string;
    }) => {
      const { data: request, error: fetchError } = await supabase
        .from('employee_leave_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update request status
      const { error: updateError } = await supabase
        .from('employee_leave_requests')
        .update({
          status,
          approved_by: approverId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, update leave balance and create attendance records
      if (status === 'approved' && request) {
        const leaveType = request.leave_type;
        const daysUsed = request.days_requested;

        // Get current balance
        const { data: balance, error: balanceError } = await supabase
          .from('employee_leave_balances')
          .select('*')
          .eq('employee_id', request.employee_id)
          .eq('fiscal_year', fiscalYear)
          .single();

        if (balanceError) throw balanceError;

        // Update the appropriate leave used field
        const updateField = `${leaveType}_leave_used`;
        const currentUsed = (balance as Record<string, unknown>)[updateField] as number || 0;

        const { error: updateBalanceError } = await supabase
          .from('employee_leave_balances')
          .update({ [updateField]: currentUsed + daysUsed })
          .eq('id', balance.id);

        if (updateBalanceError) throw updateBalanceError;

        // Create attendance records for leave days
        if (user) {
          const start = new Date(request.start_date);
          const end = new Date(request.end_date);
          const dates = eachDayOfInterval({ start, end });

          const attendanceRecords = dates.map(date => ({
            employee_id: request.employee_id,
            date: format(date, 'yyyy-MM-dd'),
            status: 'leave' as const,
            leave_request_id: requestId,
            working_hours: 0,
            overtime_hours: 0,
            created_by: user.id,
          }));

          const { error: attendanceError } = await supabase
            .from('attendance_logs')
            .upsert(attendanceRecords, { onConflict: 'employee_id,date' });

          if (attendanceError) {
            console.error('Error creating attendance records for leave:', attendanceError);
            // Don't throw - leave approval succeeded, attendance sync is secondary
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['employee-leave-balance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      toast({ 
        title: variables.status === 'approved' 
          ? 'Leave approved and attendance records created' 
          : 'Leave request updated' 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating leave request', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate available leave with dynamic company leave types
  const calculateAvailableLeave = (
    balance: LeaveBalance | null, 
    gender: string,
    companyLeaveTypes?: CompanyLeaveType[]
  ) => {
    if (!balance) return null;

    // Helper to get entitlement from company config or fallback to default
    const getEntitlement = (code: string, defaultValue: number) => {
      const lt = companyLeaveTypes?.find(t => t.code === code && t.is_active);
      return lt ? Number(lt.annual_entitlement) : defaultValue;
    };

    return {
      homeLeave: {
        accrued: balance.home_leave_accrued,
        carryForward: balance.home_leave_carried_forward,
        used: balance.home_leave_used,
        available: balance.home_leave_accrued + balance.home_leave_carried_forward - balance.home_leave_used,
      },
      sickLeave: {
        accrued: balance.sick_leave_accrued,
        carryForward: balance.sick_leave_carried_forward,
        used: balance.sick_leave_used,
        available: balance.sick_leave_accrued + balance.sick_leave_carried_forward - balance.sick_leave_used,
      },
      maternityLeave: {
        entitled: gender === 'female' ? getEntitlement('maternity', MATERNITY_PAID_DAYS) : 0,
        used: balance.maternity_leave_used,
        available: gender === 'female' ? getEntitlement('maternity', MATERNITY_PAID_DAYS) - balance.maternity_leave_used : 0,
      },
      paternityLeave: {
        entitled: gender === 'male' ? getEntitlement('paternity', PATERNITY_LEAVE_DAYS) : 0,
        used: balance.paternity_leave_used,
        available: gender === 'male' ? getEntitlement('paternity', PATERNITY_LEAVE_DAYS) - balance.paternity_leave_used : 0,
      },
      mourningLeave: {
        entitled: getEntitlement('mourning', MOURNING_LEAVE_DAYS),
        used: balance.mourning_leave_used,
        available: getEntitlement('mourning', MOURNING_LEAVE_DAYS) - balance.mourning_leave_used,
      },
      publicHolidays: {
        entitled: getPublicHolidayEntitlement(gender),
        used: balance.public_holidays_used,
        available: getPublicHolidayEntitlement(gender) - balance.public_holidays_used,
      },
    };
  };

  // Update leave balance (admin only)
  const updateLeaveBalance = useMutation({
    mutationFn: async ({ 
      balanceId, 
      data 
    }: { 
      balanceId: string;
      data: {
        home_leave_accrued?: number;
        home_leave_used?: number;
        home_leave_carried_forward?: number;
        sick_leave_accrued?: number;
        sick_leave_used?: number;
        sick_leave_carried_forward?: number;
        maternity_leave_used?: number;
        paternity_leave_used?: number;
        mourning_leave_used?: number;
        public_holidays_used?: number;
      };
    }) => {
      const { error } = await supabase
        .from('employee_leave_balances')
        .update(data)
        .eq('id', balanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-leave-balance'] });
      toast({ title: 'Leave balance updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating leave balance', description: error.message, variant: 'destructive' });
    },
  });

  return {
    leaveBalance,
    leaveRequests,
    isLoading: balanceLoading || requestsLoading,
    fiscalYear,
    initializeLeaveBalance,
    createLeaveRequest,
    updateLeaveRequestStatus,
    updateLeaveBalance,
    calculateAvailableLeave,
  };
}
