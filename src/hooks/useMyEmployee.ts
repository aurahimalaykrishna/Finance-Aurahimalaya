import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MyEmployee {
  id: string;
  company_id: string;
  user_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  date_of_join: string;
  citizenship_number: string;
  marital_status: string;
  employee_code: string | null;
  employment_type: string;
  department: string | null;
  designation: string | null;
  basic_salary: number;
  dearness_allowance: number;
  is_active: boolean;
  company?: {
    id: string;
    name: string;
    currency: string;
  };
}

export function useMyEmployee() {
  const { user } = useAuth();

  const { data: myEmployee, isLoading, error } = useQuery({
    queryKey: ['my-employee', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          company:companies(id, name, currency)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as MyEmployee | null;
    },
    enabled: !!user,
  });

  const isEmployee = !!myEmployee;

  return {
    myEmployee,
    isEmployee,
    isLoading,
    error,
  };
}
