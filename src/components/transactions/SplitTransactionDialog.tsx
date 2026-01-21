import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategorySelect } from '@/components/categories/CategorySelect';
import { Transaction } from '@/hooks/useTransactions';
import { Category } from '@/hooks/useCategories';
import { useTransactionSplits, CreateSplitData } from '@/hooks/useTransactionSplits';
import { getCurrencySymbol } from '@/lib/currencies';
import { Plus, Trash2, AlertTriangle, Check, Split } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplitTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  categories: Category[];
}

interface SplitRow {
  id: string;
  category_id: string | null;
  amount: string;
  description: string;
}

export function SplitTransactionDialog({
  open,
  onOpenChange,
  transaction,
  categories,
}: SplitTransactionDialogProps) {
  const { splits: existingSplits, createSplits, clearSplits } = useTransactionSplits(transaction?.id);
  const [rows, setRows] = useState<SplitRow[]>([]);

  const currencySymbol = getCurrencySymbol(transaction?.currency || 'NPR');
  const totalAmount = Number(transaction?.amount || 0);

  // Initialize rows when dialog opens
  useEffect(() => {
    if (open && transaction) {
      if (transaction.is_split && existingSplits.length > 0) {
        // Load existing splits
        setRows(existingSplits.map(split => ({
          id: crypto.randomUUID(),
          category_id: split.category_id,
          amount: split.amount.toString(),
          description: split.description || '',
        })));
      } else {
        // Start with two empty rows
        setRows([
          { id: crypto.randomUUID(), category_id: null, amount: '', description: '' },
          { id: crypto.randomUUID(), category_id: null, amount: '', description: '' },
        ]);
      }
    }
  }, [open, transaction, existingSplits]);

  const allocatedAmount = useMemo(() => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  }, [rows]);

  const remainingAmount = totalAmount - allocatedAmount;
  const isBalanced = Math.abs(remainingAmount) < 0.01;
  const hasValidSplits = rows.every(row => row.category_id && parseFloat(row.amount) > 0);

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), category_id: null, amount: '', description: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 2) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof SplitRow, value: string | null) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSave = async () => {
    if (!transaction || !isBalanced || !hasValidSplits) return;

    const splitsData: CreateSplitData[] = rows.map(row => ({
      category_id: row.category_id,
      amount: parseFloat(row.amount),
      description: row.description || null,
    }));

    await createSplits.mutateAsync({ transactionId: transaction.id, splits: splitsData });
    onOpenChange(false);
  };

  const handleRemoveSplit = async () => {
    if (!transaction) return;
    await clearSplits.mutateAsync({ transactionId: transaction.id });
    onOpenChange(false);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Description</span>
              <span className="font-medium">{transaction.description || 'No description'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="font-semibold text-lg">
                {currencySymbol}{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Balance indicator */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border",
            isBalanced 
              ? "bg-success/10 border-success/30" 
              : "bg-warning/10 border-warning/30"
          )}>
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              <span className="text-sm font-medium">
                {isBalanced ? 'Balanced' : 'Unbalanced'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Remaining: </span>
              <span className={cn(
                "font-semibold",
                isBalanced ? "text-success" : "text-warning"
              )}>
                {currencySymbol}{Math.abs(remainingAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Split rows */}
          <div className="space-y-3">
            <Label>Category Allocations</Label>
            {rows.map((row, index) => (
              <div key={row.id} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <CategorySelect
                        categories={categories}
                        value={row.category_id}
                        onValueChange={(value) => updateRow(row.id, 'category_id', value)}
                        type={transaction.type}
                        placeholder="Select category"
                      />
                    </div>
                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          value={row.amount}
                          onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                          className="pl-8"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                    placeholder="Description (optional)"
                    className="text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 2}
                  className="shrink-0 mt-0.5"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={addRow} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Split
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {transaction.is_split && (
            <Button
              variant="outline"
              onClick={handleRemoveSplit}
              disabled={clearSplits.isPending}
              className="w-full sm:w-auto"
            >
              Remove Split
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isBalanced || !hasValidSplits || createSplits.isPending}
            >
              {createSplits.isPending ? 'Saving...' : 'Save Splits'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
