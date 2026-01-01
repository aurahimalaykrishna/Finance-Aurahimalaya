import { useState, useCallback } from 'react';
import { useTransactions, CreateTransactionData, Transaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, Upload, Building2, Pencil, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ImportTransactionsDialog } from '@/components/transactions/ImportTransactionsDialog';
import { EditTransactionDialog } from '@/components/transactions/EditTransactionDialog';
import { ViewTransactionDialog } from '@/components/transactions/ViewTransactionDialog';
import { getCurrencySymbol, CURRENCIES } from '@/lib/currencies';

export default function Transactions() {
  const { selectedCompanyId, selectedCompany, companies, isAllCompanies } = useCompanyContext();
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction, createBulkTransactions } = useTransactions(selectedCompanyId);
  const { categories } = useCategories(selectedCompanyId);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formData, setFormData] = useState<CreateTransactionData>({
    type: 'expense',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: null,
    company_id: selectedCompanyId,
    currency: selectedCompany?.currency || 'NPR',
  });

  const handleBulkImport = useCallback(async (data: Array<{
    date: string;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    category_id?: string;
  }>) => {
    // Add company_id to each imported transaction
    const dataWithCompany = data.map(t => ({
      ...t,
      company_id: selectedCompanyId,
    }));
    await createBulkTransactions.mutateAsync(dataWithCompany);
  }, [createBulkTransactions, selectedCompanyId]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.categories?.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTransaction.mutateAsync({
      ...formData,
      company_id: formData.company_id || selectedCompanyId,
    });
    setOpen(false);
    setFormData({ 
      type: 'expense', 
      amount: 0, 
      description: '', 
      date: format(new Date(), 'yyyy-MM-dd'), 
      category_id: null,
      company_id: selectedCompanyId,
      currency: selectedCompany?.currency || 'NPR',
    });
  };

  const handleEditSave = async (id: string, data: Partial<CreateTransactionData>) => {
    await updateTransaction.mutateAsync({ id, data });
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  // Get currency symbol for a transaction - prioritize transaction's own currency
  const getTransactionCurrency = (transaction: Transaction) => {
    if (transaction.currency) {
      return getCurrencySymbol(transaction.currency);
    }
    if (transaction.companies) {
      const company = companies.find(c => c.id === transaction.company_id);
      return getCurrencySymbol(company?.currency || 'NPR');
    }
    return getCurrencySymbol(selectedCompany?.currency || 'NPR');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} disabled={isAllCompanies}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV/Excel
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={isAllCompanies}>
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {companies.length > 1 && (
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Select 
                      value={formData.company_id || ''} 
                      onValueChange={(v) => setFormData({ ...formData, company_id: v || null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v: 'income' | 'expense') => setFormData({ ...formData, type: v, category_id: null })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category_id || ''} onValueChange={(v) => setFormData({ ...formData, category_id: v || null })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={formData.currency || 'NPR'} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
                  {createTransaction.isPending ? 'Adding...' : 'Add Transaction'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isAllCompanies && (
        <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Viewing all companies. Select a specific company to add or import transactions.
        </div>
      )}

      <ImportTransactionsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        categories={categories.map(c => ({ id: c.id, name: c.name, type: c.type }))}
        onImport={handleBulkImport}
      />

      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
        categories={categories}
        onSave={handleEditSave}
        isPending={updateTransaction.isPending}
      />

      <ViewTransactionDialog
        open={!!viewingTransaction}
        onOpenChange={(open) => !open && setViewingTransaction(null)}
        transaction={viewingTransaction}
        onEdit={() => {
          setEditingTransaction(viewingTransaction);
          setViewingTransaction(null);
        }}
      />

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                {isAllCompanies && <TableHead>Company</TableHead>}
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        t.type === 'income' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{t.description || '-'}</TableCell>
                    {isAllCompanies && (
                      <TableCell>
                        {t.companies && (
                          <Badge variant="outline" className="font-normal">
                            <Building2 className="h-3 w-3 mr-1" />
                            {t.companies.name}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {t.categories && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${t.categories.color}20`, color: t.categories.color }}>
                          {t.categories.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(t.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {t.type === 'income' ? '+' : '-'}{getTransactionCurrency(t)}{Number(t.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingTransaction(t)}>
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingTransaction(t)}>
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction.mutate(t.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAllCompanies ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No transactions found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
