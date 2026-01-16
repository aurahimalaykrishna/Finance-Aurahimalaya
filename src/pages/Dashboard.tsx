import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useProfile } from '@/hooks/useProfile';
import { useBudgets } from '@/hooks/useBudgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Building2, Target, AlertTriangle, Banknote, Landmark, LineChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getCurrencySymbol } from '@/lib/currencies';
import { CurrencyConverter } from '@/components/currency/CurrencyConverter';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Progress } from '@/components/ui/progress';
export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { selectedCompanyId, selectedCompany, companies, isAllCompanies } = useCompanyContext();
  const { profile } = useProfile();
  const { transactions } = useTransactions(selectedCompanyId);
  const { categories } = useCategories(selectedCompanyId);
  const { budgets } = useBudgets(isAllCompanies ? null : selectedCompanyId);
  const { budgets: allBudgets } = useBudgets(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from) return transactions;
    return transactions.filter(t => {
      const date = new Date(t.date);
      const from = new Date(dateRange.from!);
      from.setHours(0, 0, 0, 0);
      const to = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from!);
      to.setHours(23, 59, 59, 999);
      return date >= from && date <= to;
    });
  }, [transactions, dateRange]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

  // Monthly data for chart
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthTransactions = filteredTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    return {
      month: format(date, 'MMM'),
      income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
      expenses: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
    };
  });

  // Category breakdown for pie chart
  const expensesByCategory = categories
    .filter(c => c.type === 'expense')
    .map(cat => ({
      name: cat.name,
      value: filteredTransactions.filter(t => t.category_id === cat.id).reduce((sum, t) => sum + Number(t.amount), 0),
      color: cat.color,
    }))
    .filter(c => c.value > 0);

  // Calculate budget vs actual for each expense category
  const budgetComparison = useMemo(() => {
    const relevantBudgets = isAllCompanies ? allBudgets : budgets;
    return relevantBudgets
      .filter(budget => budget.categories?.type === 'expense')
      .map(budget => {
        const spent = filteredTransactions
          .filter(t => t.category_id === budget.category_id && t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const budgetAmount = Number(budget.amount);
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        
        return {
          id: budget.id,
          categoryId: budget.category_id,
          categoryName: budget.categories?.name || 'Unknown',
          categoryColor: budget.categories?.color || '#6366f1',
          budgetAmount,
          spent,
          remaining: budgetAmount - spent,
          percentage: Math.min(percentage, 100),
          actualPercentage: percentage,
          isOverBudget: spent > budgetAmount,
          companyId: budget.company_id,
          companyName: budget.companies?.name || 'Unknown',
          companyCurrency: budget.companies?.currency || 'NPR',
        };
      });
  }, [budgets, allBudgets, filteredTransactions, isAllCompanies]);

  // Group budgets by company for the all-companies view
  const budgetsByCompany = useMemo(() => {
    if (!isAllCompanies) return {};
    return budgetComparison.reduce((acc, budget) => {
      const companyId = budget.companyId || 'unknown';
      if (!acc[companyId]) {
        acc[companyId] = {
          companyName: budget.companyName,
          companyCurrency: budget.companyCurrency,
          budgets: [],
        };
      }
      acc[companyId].budgets.push(budget);
      return acc;
    }, {} as Record<string, { companyName: string; companyCurrency: string; budgets: typeof budgetComparison }>);
  }, [budgetComparison, isAllCompanies]);

  // Company comparison data (only when viewing all companies)
  const companyData = isAllCompanies ? companies.map(company => {
    const companyTransactions = filteredTransactions.filter(t => t.company_id === company.id);
    const income = companyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = companyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      id: company.id,
      name: company.name,
      currency: company.currency || 'NPR',
      income,
      expenses,
      profit: income - expenses,
      transactionCount: companyTransactions.length,
    };
  }) : [];

  const recentTransactions = filteredTransactions.slice(0, 5);

  // Get currency symbol based on selected company or profile default
  const defaultCurrency = selectedCompany?.currency || profile?.currency || 'NPR';
  const currencySymbol = getCurrencySymbol(defaultCurrency);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          {isAllCompanies && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">All {companies.length} companies</span>
            </div>
          )}
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{currencySymbol}{totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAllCompanies ? 'All companies' : selectedCompany?.name || 'All time income'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{currencySymbol}{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAllCompanies ? 'All companies' : selectedCompany?.name || 'All time expenses'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {currencySymbol}{netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{profitMargin}% margin</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Position Cards (Single Company View) */}
      {!isAllCompanies && selectedCompany && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash in Hand</CardTitle>
              <Banknote className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {currencySymbol}{(selectedCompany.cash_in_hand || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Physical cash available</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash in Bank</CardTitle>
              <Landmark className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currencySymbol}{(selectedCompany.cash_in_bank || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bank account balance</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-purple-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Investment</CardTitle>
              <LineChart className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {currencySymbol}{(selectedCompany.investment || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Investment portfolio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Comparison (only when viewing all companies) */}
      {isAllCompanies && companyData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companyData.map(company => {
                const fullCompany = companies.find(c => c.id === company.id);
                const cashInHand = fullCompany?.cash_in_hand || 0;
                const cashInBank = fullCompany?.cash_in_bank || 0;
                const investment = fullCompany?.investment || 0;
                
                return (
                  <Card key={company.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">{company.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Income</span>
                          <span className="text-success font-medium">{getCurrencySymbol(company.currency)}{company.income.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expenses</span>
                          <span className="text-destructive font-medium">{getCurrencySymbol(company.currency)}{company.expenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-muted-foreground">Profit</span>
                          <span className={`font-semibold ${company.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {getCurrencySymbol(company.currency)}{company.profit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs border-t pt-2">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Banknote className="h-3 w-3 text-blue-500" /> Cash in Hand
                          </span>
                          <span className="text-blue-600 font-medium">{getCurrencySymbol(company.currency)}{cashInHand.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Landmark className="h-3 w-3 text-green-500" /> Cash in Bank
                          </span>
                          <span className="text-green-600 font-medium">{getCurrencySymbol(company.currency)}{cashInBank.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <LineChart className="h-3 w-3 text-purple-500" /> Investment
                          </span>
                          <span className="text-purple-600 font-medium">{getCurrencySymbol(company.currency)}{investment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t pt-2">
                          <span className="text-muted-foreground">Transactions</span>
                          <span>{company.transactionCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Budgets Overview (only when viewing all companies) */}
      {isAllCompanies && Object.keys(budgetsByCompany).length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Company Budgets Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(budgetsByCompany).map(([companyId, { companyName, companyCurrency, budgets: companyBudgets }]) => (
                <Card key={companyId} className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">{companyName}</h3>
                    <div className="space-y-3">
                      {companyBudgets.map((budget) => (
                        <div key={budget.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: budget.categoryColor }} />
                              <span className="truncate">{budget.categoryName}</span>
                              {budget.isOverBudget && (
                                <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          <Progress 
                            value={budget.percentage} 
                            className={`h-1.5 ${budget.isOverBudget ? '[&>div]:bg-destructive' : ''}`}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{getCurrencySymbol(companyCurrency)}{budget.spent.toLocaleString()}</span>
                            <span className={budget.isOverBudget ? 'text-destructive' : ''}>
                              / {getCurrencySymbol(companyCurrency)}{budget.budgetAmount.toLocaleString()} ({budget.actualPercentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                      {companyBudgets.length === 0 && (
                        <p className="text-sm text-muted-foreground">No budgets set</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Bar dataKey="income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No expense data yet
                </div>
              )}
            </div>
            
            {/* Budget vs Actual Comparison */}
            {!isAllCompanies && budgetComparison.length > 0 && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium text-muted-foreground">Budget vs Actual</h4>
                {budgetComparison.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.categoryColor }} />
                        <span>{item.categoryName}</span>
                        {item.isOverBudget && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                      <span className={item.isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {currencySymbol}{item.spent.toLocaleString()} / {currencySymbol}{item.budgetAmount.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={item.percentage} 
                      className={`h-2 ${item.isOverBudget ? '[&>div]:bg-destructive' : ''}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.actualPercentage.toFixed(0)}% used</span>
                      {item.isOverBudget ? (
                        <span className="text-destructive">Over by {currencySymbol}{Math.abs(item.remaining).toLocaleString()}</span>
                      ) : (
                        <span>{currencySymbol}{item.remaining.toLocaleString()} remaining</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Category legend for expenses without budgets */}
            <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t">
              {expensesByCategory.map((cat, i) => {
                const hasBudget = budgetComparison.some(b => b.categoryName === cat.name);
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                    {!hasBudget && !isAllCompanies && (
                      <span className="text-xs text-muted-foreground/60">(no budget)</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Converter & Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* Recent Transactions */}
        <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {transaction.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.description || transaction.categories?.name || 'Transaction'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'MMM dd, yyyy')}</p>
                        {isAllCompanies && transaction.companies && (
                          <span className="text-xs text-muted-foreground">• {transaction.companies.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{Number(transaction.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet. Add your first transaction to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency Converter */}
      <CurrencyConverter 
        defaultFrom={defaultCurrency} 
        defaultTo={defaultCurrency === 'NPR' ? 'USD' : 'NPR'} 
      />
      </div>
    </div>
  );
}
