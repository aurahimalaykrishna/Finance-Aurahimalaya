import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TransactionNote {
  id: string;
  transaction_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useTransactionNotes(transactionId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['transaction-notes', transactionId],
    queryFn: async () => {
      if (!transactionId) return [];
      
      const { data, error } = await supabase
        .from('transaction_notes')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TransactionNote[];
    },
    enabled: !!transactionId,
  });

  const addNote = useMutation({
    mutationFn: async ({ transactionId, content }: { transactionId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transaction_notes')
        .insert({
          transaction_id: transactionId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-notes', transactionId] });
      toast({ title: 'Note added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to add note', description: error.message, variant: 'destructive' });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const { data, error } = await supabase
        .from('transaction_notes')
        .update({ content })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-notes', transactionId] });
      toast({ title: 'Note updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update note', description: error.message, variant: 'destructive' });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('transaction_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-notes', transactionId] });
      toast({ title: 'Note deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete note', description: error.message, variant: 'destructive' });
    },
  });

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
  };
}
