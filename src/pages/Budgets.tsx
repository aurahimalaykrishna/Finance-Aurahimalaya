import { useState } from 'react';
import { useBudgets, CreateBudgetData } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { getCurrencySymbol } from '@/lib/currencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { CategorySelect } from '@/components/categories/CategorySelect';

export default function Budgets() {
  const { selectedCompanyId, selectedCompany, isAllCompanies } = useCompanyContext();
  const { budgets, isLoading, createBudget, deleteBudget } = useBudgets(selectedCompanyId);
  const { expenseCategories, categories, getCategoryDisplayName } = useCategories(selectedCompanyId);
  const { transactions } = useTransactions(selectedCompanyId);
  const currencySymbol = getCurrencySymbol(selectedCompany?.currency || 'NPR');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateBudgetData>({
    category_id: '',
    amount: 0,
    period: 'monthly',
    start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    company_id: selectedCompanyId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAllCompanies) {
      return; // Cannot add budget without a specific company selected
    }
    await createBudget.mutateAsync({ ...formData, company_id: selectedCompanyId });
    setOpen(false);
    setFormData({ category_id: '', amount: 0, period: 'monthly', start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'), company_id: selectedCompanyId });
  };

  const getBudgetSpent = (categoryId: string) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // Get the category and check if it's a parent
    const category = categories.find(c => c.id === categoryId);
    const subCategories = category ? categories.filter(c => c.parent_id === categoryId) : [];
    const categoryIds = [categoryId, ...subCategories.map(c => c.id)];
    
    return transactions
      .filter(t => 
        categoryIds.includes(t.category_id || '') && 
        t.type === 'expense' && 
        new Date(t.date) >= monthStart && 
        new Date(t.date) <= monthEnd
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  // Get budget category display name
  const getBudgetCategoryName = (budget: typeof budgets[0]) => {
    if (!budget.categories) return 'Unknown';
    return getCategoryDisplayName(budget.category_id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Budgets</h2>
          <p className="text-sm text-muted-foreground">Track your spending limits</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={isAllCompanies}><Plus className="mr-2 h-4 w-4" /> Add Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <CategorySelect
                  categories={expenseCategories}
                  value={formData.category_id || null}
                  onValueChange={(v) => setFormData({ ...formData, category_id: v || '' })}
                  type="expense"
                  placeholder="Select category"
                />
              </div>
              <div className="space-y-2">
                <Label>Budget Amount</Label>
                <Input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createBudget.isPending}>
                {createBudget.isPending ? 'Adding...' : 'Add Budget'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.length > 0 ? (
          budgets.map((budget) => {
            const spent = getBudgetSpent(budget.category_id);
            const percentage = Math.min((spent / Number(budget.amount)) * 100, 100);
            const isOverBudget = spent > Number(budget.amount);
            const displayName = getBudgetCategoryName(budget);
            
            return (
              <Card key={budget.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${budget.categories?.color}20` }}>
                        <Target className="w-4 h-4" style={{ color: budget.categories?.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteBudget.mutate(budget.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isOverBudget ? 'text-destructive' : 'text-muted-foreground'}>{currencySymbol}{spent.toLocaleString()} spent</span>
                      <span className="font-medium">{currencySymbol}{Number(budget.amount).toLocaleString()}</span>
                    </div>
                    <Progress value={percentage} className={isOverBudget ? '[&>div]:bg-destructive' : ''} />
                    <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(0)}% used</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mb-4 opacity-50" />
              <p>No budgets set yet</p>
              <p className="text-sm">Create a budget to track your spending</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
