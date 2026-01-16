import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  company_id: string | null;
  amount: number;
  period: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    icon: string;
    type: 'income' | 'expense';
  } | null;
  companies?: {
    id: string;
    name: string;
    currency: string;
  } | null;
}

export interface CreateBudgetData {
  category_id: string;
  amount: number;
  period: string;
  start_date: string;
  end_date?: string | null;
  company_id?: string | null;
}

export function useBudgets(companyId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', user?.id, companyId],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon,
            type
          ),
          companies (
            id,
            name,
            currency
          )
        `)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  const createBudget = useMutation({
    mutationFn: async (data: CreateBudgetData) => {
      const { error } = await supabase.from('budgets').insert({
        ...data,
        user_id: user!.id,
      } as any);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'CREATE',
        entity_type: 'budget',
        new_values: data as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating budget', description: error.message, variant: 'destructive' });
    },
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateBudgetData> }) => {
      const oldBudget = budgets.find(b => b.id === id);
      const { error } = await supabase.from('budgets').update(data as any).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'UPDATE',
        entity_type: 'budget',
        entity_id: id,
        old_values: oldBudget as any,
        new_values: data as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating budget', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const oldBudget = budgets.find(b => b.id === id);
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'DELETE',
        entity_type: 'budget',
        entity_id: id,
        old_values: oldBudget as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting budget', description: error.message, variant: 'destructive' });
    },
  });

  return {
    budgets,
    isLoading,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
