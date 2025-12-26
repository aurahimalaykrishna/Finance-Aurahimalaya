import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

export interface CreateTransactionData {
  category_id?: string | null;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  date: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      const { error } = await supabase.from('transactions').insert({
        ...data,
        user_id: user!.id,
      } as any);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'CREATE',
        entity_type: 'transaction',
        new_values: data as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating transaction', description: error.message, variant: 'destructive' });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) => {
      const oldTransaction = transactions.find(t => t.id === id);
      const { error } = await supabase.from('transactions').update(data as any).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'UPDATE',
        entity_type: 'transaction',
        entity_id: id,
        old_values: oldTransaction as any,
        new_values: data as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating transaction', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const oldTransaction = transactions.find(t => t.id === id);
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'DELETE',
        entity_type: 'transaction',
        entity_id: id,
        old_values: oldTransaction as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting transaction', description: error.message, variant: 'destructive' });
    },
  });

  const createBulkTransactions = useMutation({
    mutationFn: async (data: CreateTransactionData[]) => {
      const transactionsToInsert = data.map(t => ({
        ...t,
        user_id: user!.id,
      }));

      const { error } = await supabase.from('transactions').insert(transactionsToInsert as any);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'BULK_IMPORT',
        entity_type: 'transaction',
        new_values: { count: data.length } as any,
      } as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: `${variables.length} transactions imported successfully` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error importing transactions', description: error.message, variant: 'destructive' });
    },
  });

  return {
    transactions,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createBulkTransactions,
  };
}