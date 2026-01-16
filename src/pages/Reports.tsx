import { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { getCurrencySymbol } from '@/lib/currencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

export default function Reports() {
  const { selectedCompanyId, selectedCompany, isAllCompanies } = useCompanyContext();
  const { transactions } = useTransactions(selectedCompanyId);
  const { categories } = useCategories(selectedCompanyId);
  const currencySymbol = getCurrencySymbol(selectedCompany?.currency || 'NPR');

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = filteredTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
      const investment = monthTransactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: format(date, 'MMM'),
        income,
        expenses,
        investment,
        profit: income - expenses,
      };
    });
  }, [filteredTransactions]);

  const incomeByCategory = useMemo(() => {
    return categories
      .filter(c => c.type === 'income')
      .map(cat => ({
        name: cat.name,
        value: filteredTransactions.filter(t => t.category_id === cat.id).reduce((sum, t) => sum + Number(t.amount), 0),
        color: cat.color || '#6366f1',
      }))
      .filter(c => c.value > 0);
  }, [categories, filteredTransactions]);

  const expensesByCategory = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(cat => ({
        name: cat.name,
        value: filteredTransactions.filter(t => t.category_id === cat.id).reduce((sum, t) => sum + Number(t.amount), 0),
        color: cat.color || '#ef4444',
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, filteredTransactions]);

  const investmentByCategory = useMemo(() => {
    return categories
      .filter(c => c.type === 'investment')
      .map(cat => ({
        name: cat.name,
        value: filteredTransactions.filter(t => t.category_id === cat.id).reduce((sum, t) => sum + Number(t.amount), 0),
        color: cat.color || '#3b82f6',
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, filteredTransactions]);

  const totalIncome = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions]
  );
  
  const totalExpenses = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions]
  );

  const totalInvestment = useMemo(() => 
    filteredTransactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">
            {isAllCompanies 
              ? 'Showing data from all companies' 
              : `Showing data for ${selectedCompany?.name || 'selected company'}`}
          </p>
        </div>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Yearly Trend */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>12-Month Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, '']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="investment" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success" /><span className="text-sm text-muted-foreground">Income</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /><span className="text-sm text-muted-foreground">Expenses</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} /><span className="text-sm text-muted-foreground">Investment</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm text-muted-foreground">Profit</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses by Category Bar Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={expensesByCategory} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    width={95}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={35}>
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No expense data for selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Income by Category */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Income by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {incomeByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {incomeByCategory.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income data</div>
              )}
            </div>
            <div className="space-y-2 mt-4">
              {incomeByCategory.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currencySymbol}{cat.value.toLocaleString()}</span>
                    <span className="text-muted-foreground">({((cat.value / totalIncome) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expenses by Category Pie */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Expenses Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {expensesByCategory.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data</div>
              )}
            </div>
            <div className="space-y-2 mt-4">
              {expensesByCategory.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currencySymbol}{cat.value.toLocaleString()}</span>
                    <span className="text-muted-foreground">({((cat.value / totalExpenses) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
