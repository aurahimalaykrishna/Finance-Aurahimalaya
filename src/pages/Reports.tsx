import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { getCurrencySymbol } from '@/lib/currencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function Reports() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { selectedCompany } = useCompanyContext();
  const currencySymbol = getCurrencySymbol(selectedCompany?.currency || 'NPR');

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), 11 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      month: format(date, 'MMM'),
      income,
      expenses,
      profit: income - expenses,
    };
  });

  const incomeByCategory = categories
    .filter(c => c.type === 'income')
    .map(cat => ({
      name: cat.name,
      value: transactions.filter(t => t.category_id === cat.id).reduce((sum, t) => sum + Number(t.amount), 0),
      color: cat.color,
    }))
    .filter(c => c.value > 0);

  const expensesByCategory = categories
    .filter(c => c.type === 'expense')
    .map(cat => ({
      name: cat.name,
      value: transactions.filter(t => t.category_id === cat.id).reduce((sum, t) => sum + Number(t.amount), 0),
      color: cat.color,
    }))
    .filter(c => c.value > 0);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold">Reports & Analytics</h2>
        <p className="text-sm text-muted-foreground">Analyze your financial data</p>
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
                <Line type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success" /><span className="text-sm text-muted-foreground">Income</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /><span className="text-sm text-muted-foreground">Expenses</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-sm text-muted-foreground">Profit</span></div>
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

        {/* Expenses by Category */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {expensesByCategory.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
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