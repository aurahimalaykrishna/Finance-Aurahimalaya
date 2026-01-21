import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  company_id: string | null;
  supplier_id: string | null;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  currency?: string;
  is_reconciled?: boolean;
  reconciled_at?: string | null;
  bank_statement_id?: string | null;
  is_split?: boolean;
  categories?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
  companies?: {
    id: string;
    name: string;
  } | null;
  suppliers?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateTransactionData {
  category_id?: string | null;
  company_id?: string | null;
  supplier_id?: string | null;
  type: 'income' | 'expense' | 'investment';
  amount: number;
  description?: string;
  date: string;
  currency?: string;
}

export function useTransactions(companyId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check for duplicates against existing database records
  const checkDuplicates = async (data: CreateTransactionData[]): Promise<{
    duplicates: CreateTransactionData[];
    unique: CreateTransactionData[];
  }> => {
    if (data.length === 0 || !companyId) {
      return { duplicates: [], unique: data };
    }

    // Fetch existing transactions for the company
    const { data: existing } = await supabase
      .from('transactions')
      .select('date, amount, description')
      .eq('company_id', companyId);
    
    const existingSet = new Set(
      (existing || []).map(t => 
        `${t.date}|${t.amount}|${(t.description || '').toLowerCase().trim()}`
      )
    );
    
    const duplicates: CreateTransactionData[] = [];
    const unique: CreateTransactionData[] = [];
    
    data.forEach(transaction => {
      const key = `${transaction.date}|${transaction.amount}|${(transaction.description || '').toLowerCase().trim()}`;
      if (existingSet.has(key)) {
        duplicates.push(transaction);
      } else {
        unique.push(transaction);
        existingSet.add(key); // Prevent duplicates within the batch too
      }
    });
    
    return { duplicates, unique };
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.id, companyId],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon
          ),
          companies (
            id,
            name
          ),
          suppliers (
            id,
            name
          )
        `)
        .order('date', { ascending: false });

      // Filter by company if specified (not 'all')
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

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

  const bulkDeleteTransactions = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'BULK_DELETE',
        entity_type: 'transaction',
        new_values: { count: ids.length, ids } as any,
      } as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: `${variables.length} transactions deleted` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting transactions', description: error.message, variant: 'destructive' });
    },
  });

  const bulkUpdateTransactions = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<CreateTransactionData> }) => {
      const { error } = await supabase
        .from('transactions')
        .update(data as any)
        .in('id', ids);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'BULK_UPDATE',
        entity_type: 'transaction',
        new_values: { count: ids.length, changes: data } as any,
      } as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: `${variables.ids.length} transactions updated` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating transactions', description: error.message, variant: 'destructive' });
    },
  });

  return {
    transactions,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createBulkTransactions,
    bulkDeleteTransactions,
    bulkUpdateTransactions,
    checkDuplicates,
  };
}
