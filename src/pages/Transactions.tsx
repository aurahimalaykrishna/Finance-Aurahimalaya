import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTransactions, CreateTransactionData, Transaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, Upload, Building2, Pencil, Eye, Download, FileSpreadsheet, FileText, ArrowUpDown, ChevronUp, ChevronDown, Truck, X, PiggyBank, Split, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ImportTransactionsDialog } from '@/components/transactions/ImportTransactionsDialog';
import { EditTransactionDialog } from '@/components/transactions/EditTransactionDialog';
import { ViewTransactionDialog } from '@/components/transactions/ViewTransactionDialog';
import { BulkActionsDialog } from '@/components/transactions/BulkActionsDialog';
import { SplitTransactionDialog } from '@/components/transactions/SplitTransactionDialog';
import { CategorySelect } from '@/components/categories/CategorySelect';
import { SupplierSelect } from '@/components/suppliers/SupplierSelect';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { getCurrencySymbol, CURRENCIES } from '@/lib/currencies';
import { exportToCSV, exportToExcel } from '@/utils/exportUtils';

export default function Transactions() {
  const { selectedCompanyId, selectedCompany, companies, isAllCompanies } = useCompanyContext();
  const { profile } = useProfile();
  const { transactions, isLoading, createTransaction, updateTransaction, deleteTransaction, createBulkTransactions, bulkDeleteTransactions, bulkUpdateTransactions, checkDuplicates } = useTransactions(selectedCompanyId);
  const { categories, getCategoryDisplayName } = useCategories(selectedCompanyId);
  
  // Get currency based on selected company or profile default
  const defaultCurrency = selectedCompany?.currency || profile?.currency || 'NPR';
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [splittingTransaction, setSplittingTransaction] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'categorized' | 'uncategorized'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  
  type SortField = 'date' | 'created_at' | 'amount' | 'description' | 'type' | 'category';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [formData, setFormData] = useState<CreateTransactionData>(() => ({
    type: 'expense',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: null,
    company_id: selectedCompanyId,
    supplier_id: null,
    currency: defaultCurrency,
  }));

  // Update form currency when selected company changes
  const handleCompanyChange = (companyId: string | null) => {
    const company = companies.find(c => c.id === companyId);
    setFormData(prev => ({ 
      ...prev, 
      company_id: companyId,
      supplier_id: null, // Reset supplier when company changes
      currency: company?.currency || defaultCurrency,
    }));
  };

  // Sync form when selected company changes from sidebar
  useEffect(() => {
    if (selectedCompany) {
      setFormData(prev => ({
        ...prev,
        company_id: selectedCompanyId,
        currency: selectedCompany.currency || defaultCurrency,
      }));
    }
  }, [selectedCompanyId, selectedCompany]);

  const handleBulkImport = useCallback(async (data: Array<{
    date: string;
    amount: number;
    description: string;
    type: 'income' | 'expense' | 'investment';
    category_id?: string;
  }>, skipDatabaseDuplicates?: boolean) => {
    // Add company_id to each imported transaction
    const dataWithCompany = data.map(t => ({
      ...t,
      company_id: selectedCompanyId,
    }));

    if (skipDatabaseDuplicates) {
      // Check for duplicates and filter them out
      const { unique, duplicates } = await checkDuplicates(dataWithCompany);
      
      if (duplicates.length > 0) {
        // Toast will be shown in the hook's onSuccess
        console.log(`Skipping ${duplicates.length} duplicate transactions`);
      }
      
      if (unique.length === 0) {
        throw new Error('All transactions are duplicates and already exist in the database.');
      }
      
      await createBulkTransactions.mutateAsync(unique);
    } else {
      await createBulkTransactions.mutateAsync(dataWithCompany);
    }
  }, [createBulkTransactions, selectedCompanyId, checkDuplicates]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'date' || field === 'created_at' ? 'desc' : 'asc');
    }
  };

  // Base filtered transactions (before category filter) - used for stats calculation
  const baseFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.categories?.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      
      // Date range filter
      let matchesDate = true;
      if (dateRange?.from) {
        const date = new Date(t.date);
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        to.setHours(23, 59, 59, 999);
        matchesDate = date >= from && date <= to;
      }
      
      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, search, typeFilter, dateRange]);

  // Calculate category statistics from base filtered transactions
  const categoryStats = useMemo(() => {
    const total = baseFilteredTransactions.length;
    const categorized = baseFilteredTransactions.filter(t => t.category_id !== null);
    const uncategorized = baseFilteredTransactions.filter(t => t.category_id === null);
    
    const categorizedAmount = categorized.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const uncategorizedAmount = uncategorized.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const totalAmount = categorizedAmount + uncategorizedAmount;
    
    return {
      total,
      totalAmount,
      categorizedCount: categorized.length,
      categorizedAmount,
      categorizedPercentage: total > 0 ? (categorized.length / total * 100).toFixed(1) : '0',
      uncategorizedCount: uncategorized.length,
      uncategorizedAmount,
      uncategorizedPercentage: total > 0 ? (uncategorized.length / total * 100).toFixed(1) : '0',
    };
  }, [baseFilteredTransactions]);

  const filteredTransactions = useMemo(() => {
    // Apply category filter on top of base filtered transactions
    const filtered = baseFilteredTransactions.filter(t => {
      if (categoryFilter === 'categorized') {
        return t.category_id !== null;
      } else if (categoryFilter === 'uncategorized') {
        return t.category_id === null;
      }
      return true;
    });

    // Sort the filtered results
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'created_at':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        case 'amount':
          comparison = Number(a.amount) - Number(b.amount);
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'category':
          const catA = a.categories?.name || '';
          const catB = b.categories?.name || '';
          comparison = catA.localeCompare(catB);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [baseFilteredTransactions, categoryFilter, sortField, sortDirection]);

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 select-none transition-colors", className)}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );

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
      supplier_id: null,
      currency: defaultCurrency,
    });
  };

  const handleEditSave = async (id: string, data: Partial<CreateTransactionData>) => {
    await updateTransaction.mutateAsync({ id, data });
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const handleBulkDelete = async () => {
    await bulkDeleteTransactions.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkCategoryChange = async (categoryId: string | null) => {
    if (!categoryId) return;
    await bulkUpdateTransactions.mutateAsync({
      ids: Array.from(selectedIds),
      data: { category_id: categoryId },
    });
    setSelectedIds(new Set());
    setBulkActionOpen(false);
  };

  const handleBulkSupplierChange = async (supplierId: string | null) => {
    await bulkUpdateTransactions.mutateAsync({
      ids: Array.from(selectedIds),
      data: { supplier_id: supplierId },
    });
    setSelectedIds(new Set());
    setBulkActionOpen(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Get currency symbol for a transaction - prioritize transaction's own currency
  const getTransactionCurrency = (transaction: Transaction) => {
    if (transaction.currency) {
      return getCurrencySymbol(transaction.currency);
    }
    if (transaction.companies) {
      const company = companies.find(c => c.id === transaction.company_id);
      return getCurrencySymbol(company?.currency || defaultCurrency);
    }
    return getCurrencySymbol(defaultCurrency);
  };

  // Get display name for transaction category
  const getTransactionCategoryDisplay = (transaction: Transaction) => {
    if (!transaction.categories) return null;
    
    // Check if this category has a parent
    const category = categories.find(c => c.id === transaction.category_id);
    if (category?.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      if (parent) {
        return `${parent.name} > ${transaction.categories.name}`;
      }
    }
    return transaction.categories.name;
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
              <SelectItem value="investment">Investment</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={filteredTransactions.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToCSV(filteredTransactions, 'transactions', categories)}>
                <FileText className="mr-2 h-4 w-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToExcel(filteredTransactions, 'transactions', categories)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setImportOpen(true)} disabled={isAllCompanies}>
            <Upload className="mr-2 h-4 w-4" /> Import
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
                      onValueChange={handleCompanyChange}
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
                    <Select value={formData.type} onValueChange={(v: 'income' | 'expense' | 'investment') => setFormData({ ...formData, type: v, category_id: null })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
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
                  <CategorySelect
                    categories={filteredCategories}
                    value={formData.category_id}
                    onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                    type={formData.type as 'income' | 'expense' | 'investment'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <SupplierSelect
                    value={formData.supplier_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, supplier_id: v === 'none' ? null : v })}
                    companyId={formData.company_id}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transaction Date</Label>
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

      {/* Category Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className={cn(
            "border-border/50 cursor-pointer transition-all hover:shadow-md",
            categoryFilter === 'all' && "ring-2 ring-primary"
          )}
          onClick={() => setCategoryFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Transactions</span>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{categoryStats.total}</div>
              <p className="text-sm text-muted-foreground">
                {getCurrencySymbol(defaultCurrency)}{categoryStats.totalAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn(
            "border-border/50 cursor-pointer transition-all hover:shadow-md",
            categoryFilter === 'categorized' && "ring-2 ring-green-500"
          )}
          onClick={() => setCategoryFilter('categorized')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Categorized</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-500">{categoryStats.categorizedCount}</span>
                <span className="text-sm text-muted-foreground">({categoryStats.categorizedPercentage}%)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getCurrencySymbol(defaultCurrency)}{categoryStats.categorizedAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn(
            "border-border/50 cursor-pointer transition-all hover:shadow-md",
            categoryFilter === 'uncategorized' && "ring-2 ring-orange-500",
            categoryStats.uncategorizedCount > 0 && "bg-orange-500/5"
          )}
          onClick={() => setCategoryFilter('uncategorized')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Uncategorized</span>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-orange-500">{categoryStats.uncategorizedCount}</span>
                <span className="text-sm text-muted-foreground">({categoryStats.uncategorizedPercentage}%)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getCurrencySymbol(defaultCurrency)}{categoryStats.uncategorizedAmount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {categoryFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Showing: {categoryFilter === 'categorized' ? 'Categorized' : 'Uncategorized'} transactions
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setCategoryFilter('all')}>
            <X className="h-4 w-4 mr-1" /> Clear filter
          </Button>
        </div>
      )}

      <ImportTransactionsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        categories={categories.map(c => ({ id: c.id, name: c.name, type: c.type, parent_id: c.parent_id }))}
        onImport={handleBulkImport}
      />

      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
        categories={categories}
        onSave={handleEditSave}
        isPending={updateTransaction.isPending}
        defaultCurrency={defaultCurrency}
        companyId={editingTransaction?.company_id || selectedCompanyId}
      />

      <ViewTransactionDialog
        open={!!viewingTransaction}
        onOpenChange={(open) => !open && setViewingTransaction(null)}
        transaction={viewingTransaction}
        categories={categories}
        onEdit={() => {
          setEditingTransaction(viewingTransaction);
          setViewingTransaction(null);
        }}
        onSplit={() => {
          setSplittingTransaction(viewingTransaction);
          setViewingTransaction(null);
        }}
      />

      <SplitTransactionDialog
        open={!!splittingTransaction}
        onOpenChange={(open) => !open && setSplittingTransaction(null)}
        transaction={splittingTransaction}
        categories={categories}
      />

      <BulkActionsDialog
        open={bulkActionOpen}
        onOpenChange={setBulkActionOpen}
        selectedCount={selectedIds.size}
        categories={categories}
        companyId={selectedCompanyId}
        onChangeCategory={handleBulkCategoryChange}
        onChangeSupplier={handleBulkSupplierChange}
        isPending={bulkUpdateTransactions.isPending}
      />

      {selectedIds.size > 0 && (
        <div className="bg-muted border rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedIds.size} transaction{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkActionOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Change Category/Supplier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedIds.size} transactions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All selected transactions will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </div>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <SortableHeader field="type">Type</SortableHeader>
                <SortableHeader field="description">Description</SortableHeader>
                {isAllCompanies && <TableHead>Company</TableHead>}
                <SortableHeader field="category">Category</SortableHeader>
                <TableHead>Supplier</TableHead>
                <SortableHeader field="date">Transaction Date</SortableHeader>
                <SortableHeader field="created_at">Entry Date</SortableHeader>
                <SortableHeader field="amount" className="text-right">Amount</SortableHeader>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id} data-state={selectedIds.has(t.id) ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        t.type === 'income' ? 'bg-success/20 text-success' : 
                        t.type === 'investment' ? 'bg-blue-500/20 text-blue-600' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : 
                         t.type === 'investment' ? <PiggyBank className="w-4 h-4" /> :
                         <ArrowDownRight className="w-4 h-4" />}
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
                      {t.is_split ? (
                        <Badge variant="outline" className="font-normal text-xs">
                          <Split className="h-3 w-3 mr-1" />
                          Split
                        </Badge>
                      ) : t.categories ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${t.categories.color}20`, color: t.categories.color }}>
                          {getTransactionCategoryDisplay(t)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {t.suppliers && (
                        <Badge variant="outline" className="font-normal">
                          <Truck className="h-3 w-3 mr-1" />
                          {t.suppliers.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(t.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-muted-foreground">{t.created_at ? format(new Date(t.created_at), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className={`text-right font-semibold ${
                      t.type === 'income' ? 'text-success' : 
                      t.type === 'investment' ? 'text-blue-600' :
                      'text-destructive'
                    }`}>
                      {t.type === 'income' ? '+' : t.type === 'investment' ? '' : '-'}{getTransactionCurrency(t)}{Number(t.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingTransaction(t)}>
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setSplittingTransaction(t)}>
                          <Split className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
                  <TableCell colSpan={isAllCompanies ? 10 : 9} className="text-center py-8 text-muted-foreground">
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
