import { Building2, CreditCard, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBankAccounts } from '@/hooks/useBankAccounts';

interface CompanyBankAccountsProps {
  companyId: string;
  currency: string;
}

export function CompanyBankAccounts({ companyId, currency }: CompanyBankAccountsProps) {
  const { bankAccounts, isLoading } = useBankAccounts(companyId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse p-4 rounded-lg border">
                <div className="h-5 w-40 bg-muted rounded mb-2" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Accounts
            </CardTitle>
            <CardDescription>
              Connected bank accounts for this company
            </CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {bankAccounts && bankAccounts.length > 0 ? (
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{account.account_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {account.bank_name && <span>{account.bank_name}</span>}
                      {account.account_number && (
                        <>
                          <span>•</span>
                          <span>****{account.account_number.slice(-4)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(account.current_balance || 0)}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {account.account_type || 'Checking'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No bank accounts connected yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
