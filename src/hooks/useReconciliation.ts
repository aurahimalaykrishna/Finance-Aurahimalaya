import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/hooks/useTransactions';
import type { BankStatement } from '@/hooks/useBankStatements';

export interface ReconciliationSession {
  id: string;
  user_id: string;
  bank_account_id: string;
  company_id: string | null;
  start_date: string;
  end_date: string;
  opening_balance: number;
  closing_balance: number;
  status: string;
  matched_count: number;
  unmatched_count: number;
  difference: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  bank_accounts?: {
    id: string;
    account_name: string;
    bank_name: string | null;
  };
}

export interface CreateReconciliationData {
  bank_account_id: string;
  company_id?: string | null;
  start_date: string;
  end_date: string;
  opening_balance: number;
  closing_balance: number;
}

interface MatchSuggestion {
  statement: BankStatement;
  transaction: Transaction;
  score: number;
}

export function useReconciliation(companyId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reconciliationSessions = [], isLoading } = useQuery({
    queryKey: ['reconciliation-sessions', user?.id, companyId],
    queryFn: async () => {
      let query = supabase
        .from('reconciliation_sessions')
        .select(`
          *,
          bank_accounts (
            id,
            account_name,
            bank_name
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReconciliationSession[];
    },
    enabled: !!user,
  });

  const createSession = useMutation({
    mutationFn: async (data: CreateReconciliationData) => {
      const { data: session, error } = await supabase
        .from('reconciliation_sessions')
        .insert({
          ...data,
          user_id: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-sessions'] });
      toast({ title: 'Reconciliation session created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating session', description: error.message, variant: 'destructive' });
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReconciliationSession> }) => {
      const { error } = await supabase
        .from('reconciliation_sessions')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-sessions'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating session', description: error.message, variant: 'destructive' });
    },
  });

  const completeSession = useMutation({
    mutationFn: async ({ id, matchedCount, unmatchedCount, difference }: { 
      id: string; 
      matchedCount: number; 
      unmatchedCount: number;
      difference: number;
    }) => {
      const status = difference === 0 ? 'completed' : 'discrepancy';
      const { error } = await supabase
        .from('reconciliation_sessions')
        .update({
          status,
          matched_count: matchedCount,
          unmatched_count: unmatchedCount,
          difference,
          completed_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'COMPLETE',
        entity_type: 'reconciliation_session',
        entity_id: id,
        new_values: { status, matched_count: matchedCount, difference } as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-sessions'] });
      toast({ title: 'Reconciliation completed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error completing session', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reconciliation_sessions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-sessions'] });
      toast({ title: 'Session deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting session', description: error.message, variant: 'destructive' });
    },
  });

  // Auto-match algorithm
  const findMatches = (
    statements: BankStatement[],
    transactions: Transaction[],
    tolerance: number = 3 // days
  ): MatchSuggestion[] => {
    const suggestions: MatchSuggestion[] = [];
    const unmatchedStatements = statements.filter(s => !s.is_matched);
    const unmatchedTransactions = transactions.filter(t => !t.is_reconciled);

    for (const statement of unmatchedStatements) {
      let bestMatch: { transaction: Transaction; score: number } | null = null;
      const statementAmount = Math.abs(statement.amount);
      const statementDate = new Date(statement.statement_date);

      for (const transaction of unmatchedTransactions) {
        let score = 0;
        const txAmount = transaction.amount;
        
        // Amount match (50 points for exact, scaled for close)
        if (Math.abs(statementAmount - txAmount) < 0.01) {
          score += 50;
        } else if (Math.abs(statementAmount - txAmount) < 1) {
          score += 40;
        }

        // Date proximity (30 points max)
        const txDate = new Date(transaction.date);
        const daysDiff = Math.abs((statementDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= tolerance) {
          score += Math.round(30 * (1 - daysDiff / tolerance));
        }

        // Description similarity (20 points max) - simple keyword match
        if (statement.description && transaction.description) {
          const statementWords = statement.description.toLowerCase().split(/\s+/);
          const txWords = transaction.description.toLowerCase().split(/\s+/);
          const commonWords = statementWords.filter(w => txWords.includes(w) && w.length > 2);
          if (commonWords.length > 0) {
            score += Math.min(20, commonWords.length * 5);
          }
        }

        if (score >= 70 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { transaction, score };
        }
      }

      if (bestMatch) {
        suggestions.push({
          statement,
          transaction: bestMatch.transaction,
          score: bestMatch.score,
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score);
  };

  return {
    reconciliationSessions,
    isLoading,
    createSession,
    updateSession,
    completeSession,
    deleteSession,
    findMatches,
  };
}
