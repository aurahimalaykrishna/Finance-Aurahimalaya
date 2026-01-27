import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { 
  calculateProbationEndDate, 
  DEFAULT_PROBATION_MONTHS,
  getSalaryTypeForEmployment,
  calculateMonthlyFromDaily,
  calculateMonthlyFromHourly,
  calculateMonthlyFromTask,
  SalaryType,
  EmploymentType
} from '@/lib/nepal-hr-calculations';

export interface Employee {
  id: string;
  company_id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  citizenship_number: string;
  citizenship_document_url: string | null;
  pan_number: string | null;
  marital_status: 'single' | 'married';
  employee_code: string | null;
  employment_type: EmploymentType;
  date_of_join: string;
  probation_end_date: string | null;
  department: string | null;
  designation: string | null;
  ssf_number: string | null;
  basic_salary: number;
  dearness_allowance: number;
  salary_type: SalaryType;
  hourly_rate: number;
  estimated_tasks_per_month: number;
  is_active: boolean;
  termination_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeData {
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  citizenship_number: string;
  citizenship_document_url?: string | null;
  pan_number?: string | null;
  marital_status: 'single' | 'married';
  employee_code?: string | null;
  employment_type: EmploymentType;
  date_of_join: string;
  probation_months?: number;
  department?: string | null;
  designation?: string | null;
  ssf_number?: string | null;
  basic_salary: number;
  dearness_allowance?: number;
  salary_type?: SalaryType;
  hourly_rate?: number;
  estimated_tasks_per_month?: number;
  linked_user_id?: string | null;
}

export function useEmployees() {
  const { user } = useAuth();
  const { selectedCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('full_name');

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!user && !!selectedCompanyId,
  });

  const activeEmployees = employees.filter(e => e.is_active);
  const inactiveEmployees = employees.filter(e => !e.is_active);
  const employeesOnProbation = employees.filter(e => {
    if (!e.probation_end_date) return false;
    return new Date() < new Date(e.probation_end_date);
  });

  const createEmployee = useMutation({
    mutationFn: async (data: CreateEmployeeData) => {
      if (!selectedCompanyId || !user) throw new Error('No company selected');

      const probationEndDate = calculateProbationEndDate(
        new Date(data.date_of_join),
        data.probation_months ?? DEFAULT_PROBATION_MONTHS
      );

      // Determine salary type based on employment type
      const salaryType = data.salary_type ?? getSalaryTypeForEmployment(data.employment_type);
      
      // Calculate monthly equivalent based on salary type
      let basicSalary = data.basic_salary;
      const hourlyRate = data.hourly_rate ?? 0;
      const estimatedTasksPerMonth = data.estimated_tasks_per_month ?? 0;
      
      if (salaryType === 'daily' && hourlyRate > 0) {
        basicSalary = calculateMonthlyFromDaily(hourlyRate);
      } else if (salaryType === 'hourly' && hourlyRate > 0) {
        basicSalary = calculateMonthlyFromHourly(hourlyRate);
      } else if (salaryType === 'per_task' && hourlyRate > 0) {
        basicSalary = calculateMonthlyFromTask(hourlyRate, estimatedTasksPerMonth);
      }

      // Use linked_user_id if provided, otherwise use current user id
      const employeeUserId = data.linked_user_id || user.id;

      const { data: newEmployee, error } = await supabase
        .from('employees')
        .insert({
          company_id: selectedCompanyId,
          user_id: employeeUserId,
          full_name: data.full_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          citizenship_number: data.citizenship_number,
          citizenship_document_url: data.citizenship_document_url,
          pan_number: data.pan_number,
          marital_status: data.marital_status,
          employee_code: data.employee_code,
          employment_type: data.employment_type,
          date_of_join: data.date_of_join,
          probation_end_date: probationEndDate.toISOString().split('T')[0],
          department: data.department,
          designation: data.designation,
          ssf_number: data.ssf_number,
          basic_salary: basicSalary,
          dearness_allowance: data.dearness_allowance ?? 0,
          salary_type: salaryType,
          hourly_rate: hourlyRate,
          estimated_tasks_per_month: estimatedTasksPerMonth,
        })
        .select()
        .single();

      if (error) throw error;
      return newEmployee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating employee', description: error.message, variant: 'destructive' });
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateEmployeeData> }) => {
      const existingEmployee = employees.find(e => e.id === id);
      const updateData: Record<string, unknown> = { ...data };
      
      // Recalculate probation end if date_of_join or probation_months changed
      if (data.date_of_join || data.probation_months) {
        const joinDate = data.date_of_join || existingEmployee?.date_of_join;
        if (joinDate) {
          const probationEndDate = calculateProbationEndDate(
            new Date(joinDate),
            data.probation_months ?? DEFAULT_PROBATION_MONTHS
          );
          updateData.probation_end_date = probationEndDate.toISOString().split('T')[0];
        }
      }

      // Handle salary type and rate calculations
      if (data.employment_type || data.salary_type || data.hourly_rate !== undefined || data.estimated_tasks_per_month !== undefined) {
        const employmentType = data.employment_type || existingEmployee?.employment_type || 'regular';
        const salaryType = data.salary_type ?? getSalaryTypeForEmployment(employmentType as EmploymentType);
        const hourlyRate = data.hourly_rate ?? existingEmployee?.hourly_rate ?? 0;
        const estimatedTasksPerMonth = data.estimated_tasks_per_month ?? existingEmployee?.estimated_tasks_per_month ?? 0;
        
        updateData.salary_type = salaryType;
        updateData.hourly_rate = hourlyRate;
        updateData.estimated_tasks_per_month = estimatedTasksPerMonth;
        
        // Calculate monthly equivalent based on rate
        if (hourlyRate > 0) {
          if (salaryType === 'daily') {
            updateData.basic_salary = calculateMonthlyFromDaily(hourlyRate);
          } else if (salaryType === 'hourly') {
            updateData.basic_salary = calculateMonthlyFromHourly(hourlyRate);
          } else if (salaryType === 'per_task') {
            updateData.basic_salary = calculateMonthlyFromTask(hourlyRate, estimatedTasksPerMonth);
          }
        }
      }

      // Remove probation_months as it's not a column
      delete updateData.probation_months;

      // Handle linked_user_id - map it to user_id column
      if ('linked_user_id' in updateData) {
        if (updateData.linked_user_id) {
          updateData.user_id = updateData.linked_user_id;
        }
        delete updateData.linked_user_id;
      }

      const { data: updated, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating employee', description: error.message, variant: 'destructive' });
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting employee', description: error.message, variant: 'destructive' });
    },
  });

  const terminateEmployee = useMutation({
    mutationFn: async ({ id, terminationDate }: { id: string; terminationDate: string }) => {
      const { error } = await supabase
        .from('employees')
        .update({
          is_active: false,
          termination_date: terminationDate,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee terminated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error terminating employee', description: error.message, variant: 'destructive' });
    },
  });

  const reactivateEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .update({
          is_active: true,
          termination_date: null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee reactivated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error reactivating employee', description: error.message, variant: 'destructive' });
    },
  });

  return {
    employees,
    activeEmployees,
    inactiveEmployees,
    employeesOnProbation,
    isLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    terminateEmployee,
    reactivateEmployee,
  };
}
