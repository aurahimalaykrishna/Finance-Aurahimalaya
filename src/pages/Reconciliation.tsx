import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Upload, History, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { getCurrencySymbol } from '@/lib/currencies';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useBankStatements } from '@/hooks/useBankStatements';
import { useReconciliation } from '@/hooks/useReconciliation';
import { useTransactions } from '@/hooks/useTransactions';
import { BankAccountDialog } from '@/components/reconciliation/BankAccountDialog';
import { ImportBankStatementDialog } from '@/components/reconciliation/ImportBankStatementDialog';
import { ReconciliationWorkspace } from '@/components/reconciliation/ReconciliationWorkspace';
import { ReconciliationSummary } from '@/components/reconciliation/ReconciliationSummary';

export default function Reconciliation() {
  const { selectedCompanyId, selectedCompany } = useCompanyContext();
  const companyId = selectedCompanyId === 'all' ? null : selectedCompanyId;
  const currencySymbol = getCurrencySymbol(selectedCompany?.currency || 'NPR');

  const { bankAccounts, isLoading: loadingAccounts, createBankAccount, updateBankAccount, deleteBankAccount } = useBankAccounts(companyId);
  const { reconciliationSessions, createSession, completeSession, deleteSession, findMatches } = useReconciliation(companyId);
  const { transactions } = useTransactions(companyId);

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<typeof bankAccounts[0] | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Reconciliation session state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { bankStatements, createBulkStatements, matchStatement, matchStatementToMultiple, unmatchStatement } = useBankStatements(selectedAccountId);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) return transactions;
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  }, [transactions, startDate, endDate]);

  // Filter statements by date range
  const filteredStatements = useMemo(() => {
    if (!startDate || !endDate) return bankStatements;
    return bankStatements.filter(s => {
      const date = new Date(s.statement_date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  }, [bankStatements, startDate, endDate]);

  // Calculate totals
  const totalCredits = filteredStatements.filter(s => s.transaction_type === 'credit').reduce((sum, s) => sum + s.amount, 0);
  const totalDebits = filteredStatements.filter(s => s.transaction_type === 'debit').reduce((sum, s) => sum + s.amount, 0);
  const matchedCount = filteredStatements.filter(s => s.is_matched).length;
  const unmatchedCount = filteredStatements.filter(s => !s.is_matched).length;

  const handleStartReconciliation = async () => {
    if (!selectedAccountId || !startDate || !endDate) return;
    
    const session = await createSession.mutateAsync({
      bank_account_id: selectedAccountId,
      company_id: companyId,
      start_date: startDate,
      end_date: endDate,
      opening_balance: openingBalance,
      closing_balance: closingBalance,
    });
    setActiveSessionId(session.id);
  };

  const handleCompleteReconciliation = () => {
    if (!activeSessionId) return;
    const difference = closingBalance - (openingBalance + totalCredits - totalDebits);
    completeSession.mutate({
      id: activeSessionId,
      matchedCount,
      unmatchedCount,
      difference,
    });
    setActiveSessionId(null);
  };

  const handleAutoMatch = () => {
    const matches = findMatches(filteredStatements, filteredTransactions);
    matches.forEach(match => {
      matchStatement.mutate({
        statementId: match.statement.id,
        transactionId: match.transaction.id,
      });
    });
  };

  const handleAccountSubmit = (data: Parameters<typeof createBankAccount.mutate>[0]) => {
    if (editingAccount) {
      updateBankAccount.mutate({ id: editingAccount.id, data });
    } else {
      createBankAccount.mutate(data);
    }
    setEditingAccount(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reconciliation</h1>
          <p className="text-muted-foreground">Match your transactions with bank statements</p>
        </div>
      </div>

      <Tabs defaultValue="reconcile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reconcile">Reconcile</TabsTrigger>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="reconcile" className="space-y-4">
          {/* Setup Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reconciliation Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Bank Account</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Opening Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Closing Balance</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(true)}
                  disabled={!selectedAccountId}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Statement
                </Button>
                {!activeSessionId ? (
                  <Button
                    onClick={handleStartReconciliation}
                    disabled={!selectedAccountId || !startDate || !endDate}
                  >
                    Start Reconciliation
                  </Button>
                ) : (
                  <Button onClick={handleCompleteReconciliation}>
                    Complete Reconciliation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workspace */}
          {selectedAccountId && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <ReconciliationWorkspace
                  statements={filteredStatements}
                  transactions={filteredTransactions}
                  onMatch={(statementId, transactionId) => matchStatement.mutate({ statementId, transactionId })}
                  onMultiMatch={(statementId, transactionIds) => matchStatementToMultiple.mutate({ statementId, transactionIds })}
                  onUnmatch={(statementId) => unmatchStatement.mutate(statementId)}
                  onAutoMatch={handleAutoMatch}
                  currencySymbol={currencySymbol}
                />
              </div>
              <div>
                <ReconciliationSummary
                  openingBalance={openingBalance}
                  closingBalance={closingBalance}
                  totalCredits={totalCredits}
                  totalDebits={totalDebits}
                  matchedCount={matchedCount}
                  unmatchedCount={unmatchedCount}
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingAccount(null); setAccountDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(account => (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{account.account_name}</h3>
                      <p className="text-sm text-muted-foreground">{account.bank_name}</p>
                      {account.account_number && (
                        <p className="text-xs text-muted-foreground">****{account.account_number}</p>
                      )}
                    </div>
                    <Badge variant="outline">{account.account_type}</Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">
                      {getCurrencySymbol(account.currency || 'NPR')}{account.current_balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingAccount(account); setAccountDialogOpen(true); }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBankAccount.mutate(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {bankAccounts.length === 0 && !loadingAccounts && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No bank accounts yet. Add one to start reconciling.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Reconciliation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Matched</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliationSessions.map(session => (
                    <TableRow key={session.id}>
                      <TableCell>{format(new Date(session.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{session.bank_accounts?.account_name}</TableCell>
                      <TableCell>
                        {format(new Date(session.start_date), 'MMM d')} - {format(new Date(session.end_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{session.matched_count}</TableCell>
                      <TableCell className={session.difference !== 0 ? 'text-red-600' : ''}>
                        {currencySymbol}{Math.abs(session.difference).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {session.status === 'completed' ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : session.status === 'discrepancy' ? (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Discrepancy
                          </Badge>
                        ) : (
                          <Badge variant="outline">In Progress</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSession.mutate(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reconciliationSessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No reconciliation history yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BankAccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        account={editingAccount}
        onSubmit={handleAccountSubmit}
        companyId={companyId}
      />

      <ImportBankStatementDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        bankAccounts={bankAccounts}
        onImport={(data) => createBulkStatements.mutate(data)}
      />
    </div>
  );
}
