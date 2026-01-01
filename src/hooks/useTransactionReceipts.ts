import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TransactionReceipt {
  id: string;
  transaction_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export function useTransactionReceipts(transactionId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['transaction-receipts', transactionId],
    queryFn: async () => {
      if (!transactionId) return [];
      
      const { data, error } = await supabase
        .from('transaction_receipts')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TransactionReceipt[];
    },
    enabled: !!transactionId,
  });

  const uploadReceipt = useMutation({
    mutationFn: async ({ transactionId, file }: { transactionId: string; file: File }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${transactionId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Save receipt metadata
      const { data, error } = await supabase
        .from('transaction_receipts')
        .insert({
          transaction_id: transactionId,
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-receipts', transactionId] });
      toast({ title: 'Receipt uploaded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to upload receipt', description: error.message, variant: 'destructive' });
    },
  });

  const deleteReceipt = useMutation({
    mutationFn: async (receipt: TransactionReceipt) => {
      // Extract file path from URL
      const urlParts = receipt.file_url.split('/receipts/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('receipts').remove([filePath]);
      }

      // Delete metadata
      const { error } = await supabase
        .from('transaction_receipts')
        .delete()
        .eq('id', receipt.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-receipts', transactionId] });
      toast({ title: 'Receipt deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete receipt', description: error.message, variant: 'destructive' });
    },
  });

  return {
    receipts,
    isLoading,
    uploadReceipt,
    deleteReceipt,
  };
}
