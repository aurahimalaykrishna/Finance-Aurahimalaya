import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import {
  calculateSSFContributions,
  calculateIncomeTax,
  calculateOvertime,
  calculateGrossSalary,
  calculateNetSalary,
  getCurrentFiscalYear,
} from '@/lib/nepal-hr-calculations';
import { Employee } from './useEmployees';

export interface PayrollRun {
  id: string;
  company_id: string;
  user_id: string;
  fiscal_year: string;
  month: number;
  status: 'draft' | 'processed' | 'finalized';
  processed_at: string | null;
  finalized_at: string | null;
  created_at: string;
}

export interface Payslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  basic_salary: number;
  dearness_allowance: number;
  overtime_hours: number;
  overtime_amount: number;
  festival_allowance: number;
  other_allowances: number;
  gross_salary: number;
  ssf_employee_contribution: number;
  ssf_employer_contribution: number;
  income_tax: number;
  social_security_tax: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  working_days: number;
  present_days: number;
  leave_days: number;
  created_at: string;
}

export interface TaxSlab {
  id: string;
  fiscal_year: string;
  marital_status: 'single' | 'married';
  min_amount: number;
  max_amount: number | null;
  tax_rate: number;
  created_at: string;
}

export function usePayroll() {
  const { user } = useAuth();
  const { selectedCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fiscalYear = getCurrentFiscalYear();

  const { data: payrollRuns = [], isLoading: runsLoading } = useQuery({
    queryKey: ['payroll-runs', selectedCompanyId, fiscalYear],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .eq('fiscal_year', fiscalYear)
        .order('month', { ascending: false });

      if (error) throw error;
      return data as PayrollRun[];
    },
    enabled: !!user && !!selectedCompanyId,
  });

  const { data: taxSlabs = [], isLoading: slabsLoading } = useQuery({
    queryKey: ['tax-slabs', fiscalYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_slabs')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .order('min_amount');

      if (error) throw error;
      return data as TaxSlab[];
    },
    enabled: !!user,
  });

  // Get payslips for a specific payroll run
  const getPayslips = async (payrollRunId: string): Promise<Payslip[]> => {
    const { data, error } = await supabase
      .from('employee_payslips')
      .select('*')
      .eq('payroll_run_id', payrollRunId);

    if (error) throw error;
    return data as Payslip[];
  };

  // Create payroll run
  const createPayrollRun = useMutation({
    mutationFn: async (month: number) => {
      if (!selectedCompanyId || !user) throw new Error('No company selected');

      const { data, error } = await supabase
        .from('payroll_runs')
        .insert({
          company_id: selectedCompanyId,
          user_id: user.id,
          fiscal_year: fiscalYear,
          month,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PayrollRun;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast({ title: 'Payroll run created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating payroll run', description: error.message, variant: 'destructive' });
    },
  });

  // Process payroll for all employees
  const processPayroll = useMutation({
    mutationFn: async ({ 
      payrollRunId, 
      employees,
      includeFestivalAllowance = false,
      overtimeData = {},
    }: { 
      payrollRunId: string; 
      employees: Employee[];
      includeFestivalAllowance?: boolean;
      overtimeData?: Record<string, number>; // employeeId -> overtime hours
    }) => {
      const payslips = employees.filter(e => e.is_active).map(employee => {
        const basicSalary = Number(employee.basic_salary);
        const dearnessAllowance = Number(employee.dearness_allowance) || 0;
        const overtimeHours = overtimeData[employee.id] || 0;
        const hasSSF = !!employee.ssf_number;

        // Calculate components
        const ssfContributions = hasSSF ? calculateSSFContributions(basicSalary) : { employeeContribution: 0, employerContribution: 0 };
        const overtimeAmount = calculateOvertime(basicSalary, overtimeHours);
        const festivalAllowance = includeFestivalAllowance ? basicSalary : 0;

        // Calculate gross salary
        const grossSalary = calculateGrossSalary(
          basicSalary,
          dearnessAllowance,
          overtimeAmount,
          festivalAllowance
        );

        // Calculate annual income for tax (monthly * 12)
        const annualIncome = grossSalary * 12;
        const { tax: annualTax } = calculateIncomeTax(
          annualIncome,
          employee.marital_status,
          hasSSF
        );
        const monthlyTax = Math.round((annualTax / 12) * 100) / 100;

        // Social security tax (1% if no SSF)
        const socialSecurityTax = hasSSF ? 0 : Math.round(basicSalary * 0.01 * 100) / 100;

        const totalDeductions = ssfContributions.employeeContribution + monthlyTax + socialSecurityTax;
        const netSalary = calculateNetSalary(
          grossSalary,
          ssfContributions.employeeContribution,
          monthlyTax + socialSecurityTax
        );

        return {
          payroll_run_id: payrollRunId,
          employee_id: employee.id,
          basic_salary: basicSalary,
          dearness_allowance: dearnessAllowance,
          overtime_hours: overtimeHours,
          overtime_amount: overtimeAmount,
          festival_allowance: festivalAllowance,
          other_allowances: 0,
          gross_salary: grossSalary,
          ssf_employee_contribution: ssfContributions.employeeContribution,
          ssf_employer_contribution: ssfContributions.employerContribution,
          income_tax: monthlyTax,
          social_security_tax: socialSecurityTax,
          other_deductions: 0,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          working_days: 26, // Default working days
          present_days: 26,
          leave_days: 0,
        };
      });

      // Insert all payslips
      const { error: payslipError } = await supabase
        .from('employee_payslips')
        .insert(payslips);

      if (payslipError) throw payslipError;

      // Update payroll run status
      const { error: updateError } = await supabase
        .from('payroll_runs')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', payrollRunId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast({ title: 'Payroll processed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error processing payroll', description: error.message, variant: 'destructive' });
    },
  });

  // Finalize payroll
  const finalizePayroll = useMutation({
    mutationFn: async (payrollRunId: string) => {
      const { error } = await supabase
        .from('payroll_runs')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString(),
        })
        .eq('id', payrollRunId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast({ title: 'Payroll finalized' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error finalizing payroll', description: error.message, variant: 'destructive' });
    },
  });

  // Delete payroll run (only draft)
  const deletePayrollRun = useMutation({
    mutationFn: async (payrollRunId: string) => {
      const { error } = await supabase
        .from('payroll_runs')
        .delete()
        .eq('id', payrollRunId)
        .eq('status', 'draft');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast({ title: 'Payroll run deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting payroll run', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate payroll summary
  const calculatePayrollSummary = (payslips: Payslip[]) => {
    return payslips.reduce(
      (acc, slip) => ({
        totalGross: acc.totalGross + Number(slip.gross_salary),
        totalSSFEmployee: acc.totalSSFEmployee + Number(slip.ssf_employee_contribution),
        totalSSFEmployer: acc.totalSSFEmployer + Number(slip.ssf_employer_contribution),
        totalTax: acc.totalTax + Number(slip.income_tax) + Number(slip.social_security_tax),
        totalDeductions: acc.totalDeductions + Number(slip.total_deductions),
        totalNet: acc.totalNet + Number(slip.net_salary),
        employeeCount: acc.employeeCount + 1,
      }),
      {
        totalGross: 0,
        totalSSFEmployee: 0,
        totalSSFEmployer: 0,
        totalTax: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeeCount: 0,
      }
    );
  };

  return {
    payrollRuns,
    taxSlabs,
    fiscalYear,
    isLoading: runsLoading || slabsLoading,
    getPayslips,
    createPayrollRun,
    processPayroll,
    finalizePayroll,
    deletePayrollRun,
    calculatePayrollSummary,
  };
}
