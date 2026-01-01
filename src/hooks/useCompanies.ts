import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  currency: string | null;
  fiscal_year_start: number | null;
  is_default: boolean | null;
  logo_url: string | null;
  favicon_url: string | null;
  address: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateCompanyData {
  name: string;
  currency?: string;
  fiscal_year_start?: number;
  is_default?: boolean;
  logo_url?: string | null;
  favicon_url?: string | null;
  address?: string | null;
}

export function useCompanies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Company[];
    },
    enabled: !!user,
  });

  const defaultCompany = companies.find(c => c.is_default) || companies[0];

  const createCompany = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from('companies')
          .update({ is_default: false })
          .eq('user_id', user!.id);
      }

      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          ...data,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'CREATE',
        entity_type: 'company',
        entity_id: newCompany.id,
        new_values: data as any,
      });

      return newCompany;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating company', description: error.message, variant: 'destructive' });
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCompanyData> }) => {
      const oldCompany = companies.find(c => c.id === id);

      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from('companies')
          .update({ is_default: false })
          .eq('user_id', user!.id);
      }

      const { error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'UPDATE',
        entity_type: 'company',
        entity_id: id,
        old_values: oldCompany as any,
        new_values: data as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating company', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const oldCompany = companies.find(c => c.id === id);
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'DELETE',
        entity_type: 'company',
        entity_id: id,
        old_values: oldCompany as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting company', description: error.message, variant: 'destructive' });
    },
  });

  const setDefaultCompany = useMutation({
    mutationFn: async (id: string) => {
      // Unset all defaults first
      await supabase
        .from('companies')
        .update({ is_default: false })
        .eq('user_id', user!.id);

      // Set the new default
      const { error } = await supabase
        .from('companies')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Default company updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error setting default company', description: error.message, variant: 'destructive' });
    },
  });

  return {
    companies,
    defaultCompany,
    isLoading,
    createCompany,
    updateCompany,
    deleteCompany,
    setDefaultCompany,
  };
}
