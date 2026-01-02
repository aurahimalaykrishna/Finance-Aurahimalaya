import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Wand2, Link2, Unlink, Split } from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction } from '@/hooks/useTransactions';
import type { BankStatement } from '@/hooks/useBankStatements';

interface ReconciliationWorkspaceProps {
  statements: BankStatement[];
  transactions: Transaction[];
  onMatch: (statementId: string, transactionId: string) => void;
  onMultiMatch: (statementId: string, transactionIds: string[]) => void;
  onUnmatch: (statementId: string) => void;
  onAutoMatch: () => void;
  currencySymbol?: string;
}

export function ReconciliationWorkspace({
  statements,
  transactions,
  onMatch,
  onMultiMatch,
  onUnmatch,
  onAutoMatch,
  currencySymbol = '$',
}: ReconciliationWorkspaceProps) {
  const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(false);

  const filteredStatements = useMemo(() => {
    if (showUnmatchedOnly) {
      return statements.filter(s => !s.is_matched);
    }
    return statements;
  }, [statements, showUnmatchedOnly]);

  const filteredTransactions = useMemo(() => {
    if (showUnmatchedOnly) {
      return transactions.filter(t => !t.is_reconciled);
    }
    return transactions;
  }, [transactions, showUnmatchedOnly]);

  // Calculate selected statement amount
  const selectedStatementData = useMemo(() => {
    return statements.find(s => s.id === selectedStatement);
  }, [statements, selectedStatement]);

  // Calculate sum of selected transactions
  const selectedTransactionsTotal = useMemo(() => {
    return filteredTransactions
      .filter(t => selectedTransactions.includes(t.id))
      .reduce((sum, t) => {
        // Match the sign logic: expense = negative, income = positive
        const amount = t.type === 'expense' ? -t.amount : t.amount;
        return sum + amount;
      }, 0);
  }, [filteredTransactions, selectedTransactions]);

  // Check if amounts match (within 0.01 tolerance)
  const amountsMatch = useMemo(() => {
    if (!selectedStatementData || selectedTransactions.length === 0) return false;
    const statementAmount = selectedStatementData.transaction_type === 'debit' 
      ? -selectedStatementData.amount 
      : selectedStatementData.amount;
    return Math.abs(selectedTransactionsTotal - statementAmount) < 0.01;
  }, [selectedStatementData, selectedTransactionsTotal]);

  const handleTransactionToggle = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleMatch = () => {
    if (!selectedStatement || selectedTransactions.length === 0) return;
    
    if (selectedTransactions.length === 1) {
      onMatch(selectedStatement, selectedTransactions[0]);
    } else {
      onMultiMatch(selectedStatement, selectedTransactions);
    }
    
    setSelectedStatement(null);
    setSelectedTransactions([]);
  };

  const matchedCount = statements.filter(s => s.is_matched).length;
  const unmatchedStatements = statements.filter(s => !s.is_matched).length;
  const unmatchedTransactions = transactions.filter(t => !t.is_reconciled).length;

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{matchedCount}</p>
            <p className="text-xs text-muted-foreground">Matched</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{unmatchedStatements}</p>
            <p className="text-xs text-muted-foreground">Unmatched Statements</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{unmatchedTransactions}</p>
            <p className="text-xs text-muted-foreground">Unmatched Transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Checkbox
              id="unmatched-only"
              checked={showUnmatchedOnly}
              onCheckedChange={(checked) => setShowUnmatchedOnly(!!checked)}
            />
            <label htmlFor="unmatched-only" className="text-sm">Show unmatched only</label>
          </div>
          <Button variant="outline" onClick={onAutoMatch}>
            <Wand2 className="h-4 w-4 mr-2" />
            Auto-Match
          </Button>
          <Button
            onClick={handleMatch}
            disabled={!selectedStatement || selectedTransactions.length === 0 || !amountsMatch}
          >
            {selectedTransactions.length > 1 ? (
              <Split className="h-4 w-4 mr-2" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Match Selected {selectedTransactions.length > 1 && `(${selectedTransactions.length})`}
          </Button>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedStatement && (
        <div className={`p-3 rounded-lg border-2 ${amountsMatch ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Statement Amount</p>
                <p className={`font-semibold ${selectedStatementData?.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStatementData?.transaction_type === 'credit' ? '+' : '-'}
                  {currencySymbol}{Math.abs(selectedStatementData?.amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-2xl text-muted-foreground">=</div>
              <div>
                <p className="text-sm text-muted-foreground">Selected Transactions ({selectedTransactions.length})</p>
                <p className={`font-semibold ${selectedTransactionsTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTransactionsTotal >= 0 ? '+' : ''}{currencySymbol}{Math.abs(selectedTransactionsTotal).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {amountsMatch ? (
                <Badge className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  Amounts Match
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-500 border-orange-500">
                  Difference: {currencySymbol}{Math.abs(
                    (selectedStatementData?.transaction_type === 'debit' 
                      ? -selectedStatementData?.amount! 
                      : selectedStatementData?.amount!) - selectedTransactionsTotal
                  ).toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two-column workspace */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bank Statements Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bank Statements ({filteredStatements.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-4 pt-0">
                {filteredStatements.map(statement => (
                  <div
                    key={statement.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStatement === statement.id
                        ? 'border-primary bg-primary/5'
                        : statement.is_matched
                        ? 'border-green-500/30 bg-green-50 dark:bg-green-950/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      if (!statement.is_matched) {
                        setSelectedStatement(statement.id);
                        setSelectedTransactions([]);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{statement.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(statement.statement_date), 'MMM d, yyyy')}
                          {statement.reference_number && ` • Ref: ${statement.reference_number}`}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className={`font-medium ${statement.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {statement.transaction_type === 'credit' ? '+' : '-'}{currencySymbol}{Math.abs(statement.amount).toFixed(2)}
                        </p>
                        {statement.is_matched ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Matched
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    {statement.is_matched && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnmatch(statement.id);
                        }}
                      >
                        <Unlink className="h-3 w-3 mr-1" />
                        Unmatch
                      </Button>
                    )}
                  </div>
                ))}
                {filteredStatements.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No statements to show</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* System Transactions Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-4 pt-0">
                {filteredTransactions.map(transaction => {
                  const isSelected = selectedTransactions.includes(transaction.id);
                  return (
                    <div
                      key={transaction.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : transaction.is_reconciled
                          ? 'border-green-500/30 bg-green-50 dark:bg-green-950/20'
                          : 'border-border hover:border-primary/50'
                      } ${!transaction.is_reconciled && selectedStatement ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (!transaction.is_reconciled && selectedStatement) {
                          handleTransactionToggle(transaction.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {!transaction.is_reconciled && selectedStatement && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleTransactionToggle(transaction.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {transaction.description || 'No description'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(transaction.date), 'MMM d, yyyy')}
                                {transaction.categories && ` • ${transaction.categories.name}`}
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
                              </p>
                              {transaction.is_reconciled ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  Reconciled
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-500 border-orange-500">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredTransactions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No transactions to show</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
