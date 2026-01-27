import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInMinutes, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export interface AttendanceLog {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number;
  overtime_hours: number;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'holiday' | 'weekend';
  leave_request_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAttendanceData {
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status?: AttendanceLog['status'];
  notes?: string;
  leave_request_id?: string;
}

export interface MonthlyStats {
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  holidays: number;
  weekends: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
}

// Calculate working hours with lunch break deduction
export function calculateWorkingHours(checkIn: string, checkOut: string): { workingHours: number; overtimeHours: number } {
  const checkInTime = new Date(checkIn);
  const checkOutTime = new Date(checkOut);
  
  let totalMinutes = differenceInMinutes(checkOutTime, checkInTime);
  
  // Deduct 1 hour lunch break if worked more than 6 hours
  if (totalMinutes > 360) {
    totalMinutes -= 60;
  }
  
  const totalHours = Math.max(0, totalMinutes / 60);
  const workingHours = Math.min(totalHours, 8);
  const overtimeHours = Math.max(0, totalHours - 8);
  
  return {
    workingHours: Math.round(workingHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
  };
}

// Calculate monthly statistics from attendance records
export function calculateMonthlyStats(records: AttendanceLog[]): MonthlyStats {
  return records.reduce(
    (acc, record) => {
      switch (record.status) {
        case 'present':
          acc.presentDays++;
          break;
        case 'absent':
          acc.absentDays++;
          break;
        case 'leave':
          acc.leaveDays++;
          break;
        case 'half_day':
          acc.halfDays++;
          break;
        case 'holiday':
          acc.holidays++;
          break;
        case 'weekend':
          acc.weekends++;
          break;
      }
      acc.totalWorkingHours += Number(record.working_hours) || 0;
      acc.totalOvertimeHours += Number(record.overtime_hours) || 0;
      return acc;
    },
    {
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      halfDays: 0,
      holidays: 0,
      weekends: 0,
      totalWorkingHours: 0,
      totalOvertimeHours: 0,
    }
  );
}

export function useAttendance(employeeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get today's attendance for an employee
  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance-today', employeeId, today],
    queryFn: async () => {
      if (!employeeId) return null;
      
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data as AttendanceLog | null;
    },
    enabled: !!employeeId && !!user,
  });

  // Get monthly attendance for an employee (memoized to prevent infinite re-renders)
  const getMonthlyAttendance = useCallback(async (empId: string, month: number, year: number): Promise<AttendanceLog[]> => {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', empId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date');

    if (error) throw error;
    return data as AttendanceLog[];
  }, []);

  // Get attendance for all employees on a specific date (memoized to prevent infinite re-renders)
  const getCompanyAttendanceByDate = useCallback(async (companyId: string, date: string): Promise<AttendanceLog[]> => {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        employees!inner(id, full_name, employee_code, company_id, department, designation)
      `)
      .eq('employees.company_id', companyId)
      .eq('date', date);

    if (error) throw error;
    return data as unknown as AttendanceLog[];
  }, []);

  // Check-in mutation
  const checkIn = useMutation({
    mutationFn: async ({ employeeId: empId, notes }: { employeeId: string; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('attendance_logs')
        .insert({
          employee_id: empId,
          date: today,
          check_in: now,
          status: 'present',
          notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      toast({ title: 'Checked in successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Check-in failed', description: error.message, variant: 'destructive' });
    },
  });

  // Check-out mutation
  const checkOut = useMutation({
    mutationFn: async ({ attendanceId, notes }: { attendanceId: string; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // First get the current record to calculate hours
      const { data: current, error: fetchError } = await supabase
        .from('attendance_logs')
        .select('check_in')
        .eq('id', attendanceId)
        .single();

      if (fetchError) throw fetchError;
      if (!current?.check_in) throw new Error('No check-in time found');

      const now = new Date().toISOString();
      const { workingHours, overtimeHours } = calculateWorkingHours(current.check_in, now);
      
      // Determine status based on hours worked
      const status = workingHours < 4 ? 'half_day' : 'present';

      const { data, error } = await supabase
        .from('attendance_logs')
        .update({
          check_out: now,
          working_hours: workingHours,
          overtime_hours: overtimeHours,
          status,
          notes: notes || undefined,
        })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      toast({ title: 'Checked out successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Check-out failed', description: error.message, variant: 'destructive' });
    },
  });

  // Create or update attendance record (admin)
  const createOrUpdateAttendance = useMutation({
    mutationFn: async (data: CreateAttendanceData) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check if record exists for this date
      const { data: existing, error: checkError } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('employee_id', data.employee_id)
        .eq('date', data.date)
        .maybeSingle();

      if (checkError) throw checkError;

      let workingHours = 0;
      let overtimeHours = 0;

      if (data.check_in && data.check_out) {
        const calculated = calculateWorkingHours(data.check_in, data.check_out);
        workingHours = calculated.workingHours;
        overtimeHours = calculated.overtimeHours;
      }

      if (existing) {
        // Update existing record
        const { data: updated, error } = await supabase
          .from('attendance_logs')
          .update({
            check_in: data.check_in,
            check_out: data.check_out,
            working_hours: workingHours,
            overtime_hours: overtimeHours,
            status: data.status || 'present',
            notes: data.notes,
            leave_request_id: data.leave_request_id,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return updated as AttendanceLog;
      } else {
        // Create new record
        const { data: created, error } = await supabase
          .from('attendance_logs')
          .insert({
            employee_id: data.employee_id,
            date: data.date,
            check_in: data.check_in,
            check_out: data.check_out,
            working_hours: workingHours,
            overtime_hours: overtimeHours,
            status: data.status || 'present',
            notes: data.notes,
            leave_request_id: data.leave_request_id,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return created as AttendanceLog;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      toast({ title: 'Attendance record saved' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving attendance', description: error.message, variant: 'destructive' });
    },
  });

  // Mark as absent
  const markAsAbsent = useMutation({
    mutationFn: async ({ employeeId: empId, date }: { employeeId: string; date: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('attendance_logs')
        .upsert({
          employee_id: empId,
          date,
          status: 'absent',
          working_hours: 0,
          overtime_hours: 0,
          created_by: user.id,
        }, { onConflict: 'employee_id,date' })
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      toast({ title: 'Marked as absent' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error marking absent', description: error.message, variant: 'destructive' });
    },
  });

  // Mark as holiday
  const markAsHoliday = useMutation({
    mutationFn: async ({ employeeIds, date }: { employeeIds: string[]; date: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const records = employeeIds.map(empId => ({
        employee_id: empId,
        date,
        status: 'holiday' as const,
        working_hours: 0,
        overtime_hours: 0,
        created_by: user.id,
      }));

      const { error } = await supabase
        .from('attendance_logs')
        .upsert(records, { onConflict: 'employee_id,date' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      toast({ title: 'Holiday marked for all employees' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error marking holiday', description: error.message, variant: 'destructive' });
    },
  });

  // Create leave attendance records when leave is approved
  const syncLeaveToAttendance = async (
    employeeId: string, 
    startDate: string, 
    endDate: string,
    leaveRequestId: string
  ) => {
    if (!user) throw new Error('Not authenticated');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = eachDayOfInterval({ start, end });

    const records = dates.map(date => ({
      employee_id: employeeId,
      date: format(date, 'yyyy-MM-dd'),
      status: 'leave' as const,
      leave_request_id: leaveRequestId,
      working_hours: 0,
      overtime_hours: 0,
      created_by: user.id,
    }));

    const { error } = await supabase
      .from('attendance_logs')
      .upsert(records, { onConflict: 'employee_id,date' });

    if (error) throw error;
  };

  // Delete attendance record
  const deleteAttendance = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { error } = await supabase
        .from('attendance_logs')
        .delete()
        .eq('id', attendanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      toast({ title: 'Attendance record deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting attendance', description: error.message, variant: 'destructive' });
    },
  });

  return {
    todayAttendance,
    isLoading: todayLoading,
    checkIn,
    checkOut,
    createOrUpdateAttendance,
    markAsAbsent,
    markAsHoliday,
    deleteAttendance,
    getMonthlyAttendance,
    getCompanyAttendanceByDate,
    syncLeaveToAttendance,
    calculateMonthlyStats,
  };
}
