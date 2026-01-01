import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Building2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrencySymbol } from '@/lib/currencies';
import { Transaction } from '@/hooks/useTransactions';
import { TransactionNotes } from './TransactionNotes';
import { ReceiptUpload } from './ReceiptUpload';

interface ViewTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onEdit?: () => void;
}

export function ViewTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onEdit,
}: ViewTransactionDialogProps) {
  if (!transaction) return null;

  const currencySymbol = getCurrencySymbol(transaction.currency || 'NPR');
  const isIncome = transaction.type === 'income';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-140px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Type Badge */}
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className={`text-sm px-4 py-2 ${
                  isIncome
                    ? 'bg-success/10 text-success border-success/30'
                    : 'bg-destructive/10 text-destructive border-destructive/30'
                }`}
              >
                {isIncome ? (
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                )}
                {isIncome ? 'Income' : 'Expense'}
              </Badge>
            </div>

            {/* Amount */}
            <div className="text-center">
              <p
                className={`text-3xl font-bold ${
                  isIncome ? 'text-success' : 'text-destructive'
                }`}
              >
                {isIncome ? '+' : '-'}
                {currencySymbol}
                {Number(transaction.amount).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {transaction.currency || 'NPR'}
              </p>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="space-y-4">
              <DetailRow label="Description" value={transaction.description || '-'} />
              
              {transaction.categories && (
                <DetailRow
                  label="Category"
                  value={
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${transaction.categories.color}20`,
                        color: transaction.categories.color || undefined,
                      }}
                    >
                      {transaction.categories.name}
                    </span>
                  }
                />
              )}

              {transaction.companies && (
                <DetailRow
                  label="Company"
                  value={
                    <Badge variant="outline" className="font-normal">
                      <Building2 className="h-3 w-3 mr-1" />
                      {transaction.companies.name}
                    </Badge>
                  }
                />
              )}

              <DetailRow
                label="Date"
                value={format(new Date(transaction.date), 'MMMM dd, yyyy')}
              />

              <Separator />

              <DetailRow
                label="Reconciled"
                value={
                  transaction.is_reconciled ? (
                    <span className="inline-flex items-center gap-1.5 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <XCircle className="h-4 w-4" />
                      No
                    </span>
                  )
                }
              />

              {transaction.reconciled_at && (
                <DetailRow
                  label="Reconciled At"
                  value={format(new Date(transaction.reconciled_at), 'MMM dd, yyyy HH:mm')}
                />
              )}
            </div>

            <Separator />

            {/* Receipts Section */}
            <ReceiptUpload transactionId={transaction.id} />

            <Separator />

            {/* Notes Section */}
            <TransactionNotes transactionId={transaction.id} />

            <Separator />

            {/* Timestamps */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Created</span>
                <span>
                  {transaction.created_at
                    ? format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>
                  {transaction.updated_at
                    ? format(new Date(transaction.updated_at), 'MMM dd, yyyy HH:mm')
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex gap-2 justify-end p-4 border-t">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
