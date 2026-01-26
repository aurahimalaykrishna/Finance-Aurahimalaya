import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InvoiceItemInput } from '@/hooks/useInvoices';

interface InvoiceItemsEditorProps {
  items: InvoiceItemInput[];
  onChange: (items: InvoiceItemInput[]) => void;
  currency?: string;
}

export function InvoiceItemsEditor({ items, onChange, currency = 'NPR' }: InvoiceItemsEditorProps) {
  const addItem = () => {
    onChange([
      ...items,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const updateItem = (index: number, field: keyof InvoiceItemInput, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'description') {
      item.description = value as string;
    } else {
      item[field] = Number(value) || 0;
    }

    // Recalculate amount
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
      const baseAmount = item.quantity * item.unit_price;
      const taxAmount = baseAmount * (item.tax_rate / 100);
      item.amount = baseAmount + taxAmount;
    }

    newItems[index] = item;
    onChange(newItems);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Description</TableHead>
              <TableHead className="w-[12%]">Qty</TableHead>
              <TableHead className="w-[15%]">Unit Price</TableHead>
              <TableHead className="w-[10%]">Tax %</TableHead>
              <TableHead className="w-[15%] text-right">Amount</TableHead>
              <TableHead className="w-[8%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No items added yet. Click "Add Item" to start.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Item description"
                      className="border-0 focus-visible:ring-0 p-0 h-auto"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      min="0"
                      step="0.01"
                      className="border-0 focus-visible:ring-0 p-0 h-auto w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      min="0"
                      step="0.01"
                      className="border-0 focus-visible:ring-0 p-0 h-auto w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.tax_rate}
                      onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                      className="border-0 focus-visible:ring-0 p-0 h-auto w-16"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {currency} {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}
