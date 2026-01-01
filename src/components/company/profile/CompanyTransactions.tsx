import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  currency: string | null;
  categories?: {
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
}

interface CompanyTransactionsProps {
  companyId: string;
  transactions: Transaction[];
  currency: string;
}

export function CompanyTransactions({ companyId, transactions, currency }: CompanyTransactionsProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Last 10 transactions for this company</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/transactions?company=${companyId}`)}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'income'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-400'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {transaction.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                      {transaction.categories && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {transaction.categories.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions recorded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
