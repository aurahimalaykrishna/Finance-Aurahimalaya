import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MyPayslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  basic_salary: number;
  dearness_allowance: number | null;
  overtime_hours: number | null;
  overtime_amount: number | null;
  festival_allowance: number | null;
  other_allowances: number | null;
  gross_salary: number;
  ssf_employee_contribution: number | null;
  ssf_employer_contribution: number | null;
  income_tax: number | null;
  social_security_tax: number | null;
  other_deductions: number | null;
  total_deductions: number;
  net_salary: number;
  working_days: number | null;
  present_days: number | null;
  leave_days: number | null;
  created_at: string;
  payroll_run?: {
    id: string;
    month: number;
    fiscal_year: string;
    status: string;
    processed_at: string | null;
    finalized_at: string | null;
  };
}

export function useMyPayslips(employeeId?: string) {
  const { user } = useAuth();

  const { data: payslips = [], isLoading, error } = useQuery({
    queryKey: ['my-payslips', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from('employee_payslips')
        .select(`
          *,
          payroll_run:payroll_runs(id, month, fiscal_year, status, processed_at, finalized_at)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MyPayslip[];
    },
    enabled: !!employeeId && !!user,
  });

  return {
    payslips,
    isLoading,
    error,
  };
}
