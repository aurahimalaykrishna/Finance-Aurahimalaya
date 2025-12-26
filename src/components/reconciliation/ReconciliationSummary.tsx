import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReconciliationSummaryProps {
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  matchedCount: number;
  unmatchedCount: number;
}

export function ReconciliationSummary({
  openingBalance,
  closingBalance,
  totalCredits,
  totalDebits,
  matchedCount,
  unmatchedCount,
}: ReconciliationSummaryProps) {
  const calculatedClosing = openingBalance + totalCredits - totalDebits;
  const difference = closingBalance - calculatedClosing;
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          Reconciliation Summary
          {isBalanced ? (
            <Badge className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Balanced
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Difference Found
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Opening Balance</span>
            <span className="font-medium">${openingBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Plus: Credits/Income</span>
            <span>+${totalCredits.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-red-600">
            <span>Minus: Debits/Expenses</span>
            <span>-${totalDebits.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Calculated Closing</span>
            <span className="font-medium">${calculatedClosing.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Actual Closing Balance</span>
            <span className="font-medium">${closingBalance.toFixed(2)}</span>
          </div>
          <div className={`border-t pt-2 flex justify-between font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
            <span>Difference</span>
            <span>${Math.abs(difference).toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Matched Items</span>
            <span className="font-medium text-green-600">{matchedCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Unmatched Items</span>
            <span className="font-medium text-orange-500">{unmatchedCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
