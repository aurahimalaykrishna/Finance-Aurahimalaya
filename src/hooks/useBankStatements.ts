import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BankStatement {
  id: string;
  user_id: string;
  bank_account_id: string;
  statement_date: string;
  reference_number: string | null;
  description: string | null;
  amount: number;
  running_balance: number | null;
  transaction_type: string | null;
  is_matched: boolean;
  matched_transaction_id: string | null;
  created_at: string;
}

export interface CreateBankStatementData {
  bank_account_id: string;
  statement_date: string;
  reference_number?: string;
  description?: string;
  amount: number;
  running_balance?: number;
  transaction_type?: string;
}

export function useBankStatements(bankAccountId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bankStatements = [], isLoading } = useQuery({
    queryKey: ['bank-statements', user?.id, bankAccountId],
    queryFn: async () => {
      if (!bankAccountId) return [];
      
      const { data, error } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('bank_account_id', bankAccountId)
        .order('statement_date', { ascending: false });

      if (error) throw error;
      return data as BankStatement[];
    },
    enabled: !!user && !!bankAccountId,
  });

  const createBulkStatements = useMutation({
    mutationFn: async (data: CreateBankStatementData[]) => {
      const statementsToInsert = data.map(s => ({
        ...s,
        user_id: user!.id,
      }));

      const { error } = await supabase.from('bank_statements').insert(statementsToInsert as any);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'BULK_IMPORT',
        entity_type: 'bank_statement',
        new_values: { count: data.length } as any,
      } as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      toast({ title: `${variables.length} bank statement entries imported` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error importing statements', description: error.message, variant: 'destructive' });
    },
  });

  const matchStatement = useMutation({
    mutationFn: async ({ statementId, transactionId }: { statementId: string; transactionId: string }) => {
      // Update bank statement
      const { error: statementError } = await supabase
        .from('bank_statements')
        .update({ is_matched: true, matched_transaction_id: transactionId } as any)
        .eq('id', statementId);
      if (statementError) throw statementError;

      // Update transaction
      const { error: txError } = await supabase
        .from('transactions')
        .update({ is_reconciled: true, reconciled_at: new Date().toISOString(), bank_statement_id: statementId } as any)
        .eq('id', transactionId);
      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transaction matched successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error matching transaction', description: error.message, variant: 'destructive' });
    },
  });

  // Multi-match: match one statement to multiple transactions
  const matchStatementToMultiple = useMutation({
    mutationFn: async ({ statementId, transactionIds }: { statementId: string; transactionIds: string[] }) => {
      // Insert junction records
      const matchRecords = transactionIds.map(txId => ({
        bank_statement_id: statementId,
        transaction_id: txId,
        user_id: user!.id,
      }));
      
      const { error: matchError } = await supabase
        .from('statement_transaction_matches')
        .insert(matchRecords as any);
      if (matchError) throw matchError;

      // Mark statement as matched (keep matched_transaction_id null for multi-match)
      const { error: statementError } = await supabase
        .from('bank_statements')
        .update({ is_matched: true } as any)
        .eq('id', statementId);
      if (statementError) throw statementError;

      // Mark all transactions as reconciled
      const { error: txError } = await supabase
        .from('transactions')
        .update({ is_reconciled: true, reconciled_at: new Date().toISOString(), bank_statement_id: statementId } as any)
        .in('id', transactionIds);
      if (txError) throw txError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statement-matches'] });
      toast({ title: `${variables.transactionIds.length} transactions matched to statement` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error matching transactions', description: error.message, variant: 'destructive' });
    },
  });

  // Multi-match: match multiple statements to multiple transactions
  const matchMultipleStatements = useMutation({
    mutationFn: async ({ statementIds, transactionIds }: { statementIds: string[]; transactionIds: string[] }) => {
      // Insert junction records for all statement-transaction combinations
      const matchRecords = statementIds.flatMap(stmtId => 
        transactionIds.map(txId => ({
          bank_statement_id: stmtId,
          transaction_id: txId,
          user_id: user!.id,
        }))
      );
      
      const { error: matchError } = await supabase
        .from('statement_transaction_matches')
        .insert(matchRecords as any);
      if (matchError) throw matchError;

      // Mark all statements as matched
      const { error: statementError } = await supabase
        .from('bank_statements')
        .update({ is_matched: true } as any)
        .in('id', statementIds);
      if (statementError) throw statementError;

      // Mark all transactions as reconciled
      const { error: txError } = await supabase
        .from('transactions')
        .update({ is_reconciled: true, reconciled_at: new Date().toISOString() } as any)
        .in('id', transactionIds);
      if (txError) throw txError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statement-matches'] });
      toast({ title: `${variables.statementIds.length} statements matched to ${variables.transactionIds.length} transactions` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error matching statements', description: error.message, variant: 'destructive' });
    },
  });

  const unmatchStatement = useMutation({
    mutationFn: async (statementId: string) => {
      const statement = bankStatements.find(s => s.id === statementId);
      
      // Delete any junction records first
      await supabase
        .from('statement_transaction_matches')
        .delete()
        .eq('bank_statement_id', statementId);

      // Update bank statement
      const { error: statementError } = await supabase
        .from('bank_statements')
        .update({ is_matched: false, matched_transaction_id: null } as any)
        .eq('id', statementId);
      if (statementError) throw statementError;

      // Update single matched transaction if there was one
      if (statement?.matched_transaction_id) {
        const { error: txError } = await supabase
          .from('transactions')
          .update({ is_reconciled: false, reconciled_at: null, bank_statement_id: null } as any)
          .eq('id', statement.matched_transaction_id);
        if (txError) throw txError;
      }

      // Also unreconcile any transactions linked via junction table
      const { error: txMultiError } = await supabase
        .from('transactions')
        .update({ is_reconciled: false, reconciled_at: null, bank_statement_id: null } as any)
        .eq('bank_statement_id', statementId);
      if (txMultiError) throw txMultiError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statement-matches'] });
      toast({ title: 'Match removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing match', description: error.message, variant: 'destructive' });
    },
  });

  const deleteStatements = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('bank_statements')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      toast({ title: 'Statements deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting statements', description: error.message, variant: 'destructive' });
    },
  });

  return {
    bankStatements,
    isLoading,
    createBulkStatements,
    matchStatement,
    matchStatementToMultiple,
    matchMultipleStatements,
    unmatchStatement,
    deleteStatements,
  };
}
