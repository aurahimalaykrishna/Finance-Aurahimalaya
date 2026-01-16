import { Calendar, DollarSign, TrendingUp, TrendingDown, Wallet, PiggyBank, FolderOpen, Building2, Banknote, Landmark, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface Company {
  id: string;
  name: string;
  currency?: string | null;
  fiscal_year_start?: number | null;
  created_at?: string | null;
  cash_in_hand?: number | null;
  cash_in_bank?: number | null;
  investment?: number | null;
}

interface CompanyStats {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  bankAccountsCount: number;
  bankAccountsTotal: number;
  categoriesCount: { income: number; expense: number };
  activeBudgetsCount: number;
}

interface CompanyOverviewProps {
  company: Company;
  stats: CompanyStats;
}

export function CompanyOverview({ company, stats }: CompanyOverviewProps) {
  const currency = company.currency || 'USD';
  const fiscalMonth = MONTHS[(company.fiscal_year_start || 1) - 1];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Company Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Company Details</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Currency</span>
            <span className="font-medium">{currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fiscal Year</span>
            <span className="font-medium">{fiscalMonth}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">
              {company.created_at ? format(new Date(company.created_at), 'MMM yyyy') : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Income */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(stats.totalIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {stats.totalTransactions} transactions
          </p>
        </CardContent>
      </Card>

      {/* Total Expense */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
          <TrendingDown className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600">
            {formatCurrency(stats.totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across all categories
          </p>
        </CardContent>
      </Card>

      {/* Net Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(stats.netBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Income - Expenses
          </p>
        </CardContent>
      </Card>

      {/* Cash in Hand */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
          <Banknote className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(company.cash_in_hand || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Physical cash available</p>
        </CardContent>
      </Card>

      {/* Cash in Bank */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash in Bank</CardTitle>
          <Landmark className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(company.cash_in_bank || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Bank account balance</p>
        </CardContent>
      </Card>

      {/* Investment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investment</CardTitle>
          <LineChart className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(company.investment || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Investment portfolio</p>
        </CardContent>
      </Card>

      {/* Bank Accounts Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.bankAccountsCount}</div>
          <p className="text-xs text-muted-foreground">
            Total: {formatCurrency(stats.bankAccountsTotal)}
          </p>
        </CardContent>
      </Card>

      {/* Active Budgets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeBudgetsCount}</div>
          <p className="text-xs text-muted-foreground">
            Budgets configured
          </p>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{stats.categoriesCount.income}</div>
              <p className="text-xs text-muted-foreground">Income categories</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-600">{stats.categoriesCount.expense}</div>
              <p className="text-xs text-muted-foreground">Expense categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
