import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BankAccount {
  id: string;
  user_id: string;
  company_id: string | null;
  account_name: string;
  account_number: string | null;
  bank_name: string | null;
  account_type: string;
  currency: string;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  company_id?: string | null;
  account_name: string;
  account_number?: string;
  bank_name?: string;
  account_type?: string;
  currency?: string;
  current_balance?: number;
}

export function useBankAccounts(companyId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bankAccounts = [], isLoading } = useQuery({
    queryKey: ['bank-accounts', user?.id, companyId],
    queryFn: async () => {
      let query = supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user!.id)
        .order('account_name');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!user,
  });

  const createBankAccount = useMutation({
    mutationFn: async (data: CreateBankAccountData) => {
      const { error } = await supabase.from('bank_accounts').insert({
        ...data,
        user_id: user!.id,
      } as any);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'CREATE',
        entity_type: 'bank_account',
        new_values: data as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Bank account created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating bank account', description: error.message, variant: 'destructive' });
    },
  });

  const updateBankAccount = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateBankAccountData> }) => {
      const oldAccount = bankAccounts.find(a => a.id === id);
      const { error } = await supabase.from('bank_accounts').update(data as any).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'UPDATE',
        entity_type: 'bank_account',
        entity_id: id,
        old_values: oldAccount as any,
        new_values: data as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Bank account updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating bank account', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBankAccount = useMutation({
    mutationFn: async (id: string) => {
      const oldAccount = bankAccounts.find(a => a.id === id);
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'DELETE',
        entity_type: 'bank_account',
        entity_id: id,
        old_values: oldAccount as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast({ title: 'Bank account deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting bank account', description: error.message, variant: 'destructive' });
    },
  });

  return {
    bankAccounts,
    isLoading,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
  };
}
