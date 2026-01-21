import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TransactionSplit {
  id: string;
  transaction_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  user_id: string;
  created_at: string;
  categories?: {
    id: string;
    name: string;
    color: string;
    icon: string;
    type: 'income' | 'expense' | 'investment';
  } | null;
}

export interface CreateSplitData {
  category_id: string | null;
  amount: number;
  description?: string | null;
}

export function useTransactionSplits(transactionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: splits = [], isLoading } = useQuery({
    queryKey: ['transaction-splits', transactionId],
    queryFn: async () => {
      if (!transactionId) return [];
      
      const { data, error } = await supabase
        .from('transaction_splits')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon,
            type
          )
        `)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TransactionSplit[];
    },
    enabled: !!user && !!transactionId,
  });

  const createSplits = useMutation({
    mutationFn: async ({ transactionId, splits }: { transactionId: string; splits: CreateSplitData[] }) => {
      // First, delete existing splits
      const { error: deleteError } = await supabase
        .from('transaction_splits')
        .delete()
        .eq('transaction_id', transactionId);
      
      if (deleteError) throw deleteError;

      // Insert new splits
      const splitsToInsert = splits.map(split => ({
        transaction_id: transactionId,
        category_id: split.category_id,
        amount: split.amount,
        description: split.description || null,
        user_id: user!.id,
      }));

      const { error: insertError } = await supabase
        .from('transaction_splits')
        .insert(splitsToInsert);

      if (insertError) throw insertError;

      // Mark transaction as split
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ is_split: true, category_id: null })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'SPLIT',
        entity_type: 'transaction',
        entity_id: transactionId,
        new_values: { splits: splitsToInsert } as any,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-splits', variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction split successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error splitting transaction', description: error.message, variant: 'destructive' });
    },
  });

  const clearSplits = useMutation({
    mutationFn: async ({ transactionId, categoryId }: { transactionId: string; categoryId?: string | null }) => {
      // Delete all splits for this transaction
      const { error: deleteError } = await supabase
        .from('transaction_splits')
        .delete()
        .eq('transaction_id', transactionId);
      
      if (deleteError) throw deleteError;

      // Mark transaction as not split and restore category if provided
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ is_split: false, category_id: categoryId || null })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'UNSPLIT',
        entity_type: 'transaction',
        entity_id: transactionId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-splits', variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Split removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing split', description: error.message, variant: 'destructive' });
    },
  });

  return {
    splits,
    isLoading,
    createSplits,
    clearSplits,
  };
}
