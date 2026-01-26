import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerInsert {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_id?: string | null;
  is_active?: boolean;
}

export interface CustomerUpdate extends Partial<CustomerInsert> {
  id: string;
}

export function useCustomers() {
  const { user } = useAuth();
  const { selectedCompanyId, isAllCompanies } = useCompanyContext();
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['customers', selectedCompanyId, isAllCompanies],
    queryFn: async () => {
      // If "All Companies" is selected, fetch all customers
      if (isAllCompanies) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data as Customer[];
      }
      
      // Otherwise, filter by selected company
      if (!selectedCompanyId) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('name');

      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user && (!!selectedCompanyId || isAllCompanies),
  });

  const createCustomer = useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      if (!user || !selectedCompanyId) throw new Error('Not authenticated or no company selected');

      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          user_id: user.id,
          company_id: selectedCompanyId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', selectedCompanyId] });
      toast.success('Customer created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create customer: ' + error.message);
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', selectedCompanyId] });
      toast.success('Customer updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update customer: ' + error.message);
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', selectedCompanyId] });
      toast.success('Customer deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete customer: ' + error.message);
    },
  });

  return {
    customers: customersQuery.data ?? [],
    isLoading: customersQuery.isLoading,
    error: customersQuery.error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
