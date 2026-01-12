import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction, CreateTransactionData } from '@/hooks/useTransactions';
import { CategorySelect } from '@/components/categories/CategorySelect';
import { SupplierSelect } from '@/components/suppliers/SupplierSelect';
import { format } from 'date-fns';
import { CURRENCIES } from '@/lib/currencies';
import { Category } from '@/hooks/useCategories';

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  categories: Category[];
  onSave: (id: string, data: Partial<CreateTransactionData>) => Promise<void>;
  isPending?: boolean;
  defaultCurrency?: string;
  companyId?: string | null;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  onSave,
  isPending = false,
  defaultCurrency = 'NPR',
  companyId,
}: EditTransactionDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateTransactionData>>({
    type: 'expense',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: null,
    supplier_id: null,
    currency: defaultCurrency,
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: Number(transaction.amount),
        description: transaction.description || '',
        date: transaction.date,
        category_id: transaction.category_id,
        supplier_id: transaction.supplier_id,
        currency: transaction.currency || 'NPR',
      });
    }
  }, [transaction]);

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transaction) {
      await onSave(transaction.id, formData);
      onOpenChange(false);
    }
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData({ ...formData, type, category_id: null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input 
                type="number" 
                step="0.01" 
                min="0" 
                value={formData.amount} 
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <CategorySelect
              categories={filteredCategories}
              value={formData.category_id || null}
              onValueChange={(v) => setFormData({ ...formData, category_id: v })}
              type={formData.type}
            />
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <SupplierSelect
              value={formData.supplier_id || 'none'}
              onValueChange={(v) => setFormData({ ...formData, supplier_id: v === 'none' ? null : v })}
              companyId={companyId}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transaction Date</Label>
              <Input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.currency || 'NPR'} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
