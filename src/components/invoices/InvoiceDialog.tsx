import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useInvoices, Invoice, InvoiceItemInput } from '@/hooks/useInvoices';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { CustomerSelect } from './CustomerSelect';
import { CustomerDialog } from './CustomerDialog';
import { InvoiceItemsEditor } from './InvoiceItemsEditor';
import { CURRENCIES } from '@/lib/currencies';

const invoiceSchema = z.object({
  customer_id: z.string().nullable(),
  issue_date: z.date(),
  due_date: z.date(),
  currency: z.string().default('NPR'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  discount_amount: z.number().min(0).default(0),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
}

export function InvoiceDialog({ open, onOpenChange, invoice }: InvoiceDialogProps) {
  const { createInvoice, updateInvoice, getInvoiceWithItems } = useInvoices();
  const { selectedCompany } = useCompanyContext();
  const isEditing = !!invoice;

  const [items, setItems] = useState<InvoiceItemInput[]>([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: null,
      issue_date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      currency: selectedCompany?.currency || 'NPR',
      notes: '',
      terms: 'Payment due within 30 days.',
      discount_amount: 0,
    },
  });

  // Load invoice data when editing
  useEffect(() => {
    const loadInvoice = async () => {
      if (invoice && open) {
        setIsLoadingInvoice(true);
        try {
          const fullInvoice = await getInvoiceWithItems(invoice.id);
          if (fullInvoice) {
            form.reset({
              customer_id: fullInvoice.customer_id,
              issue_date: new Date(fullInvoice.issue_date),
              due_date: new Date(fullInvoice.due_date),
              currency: fullInvoice.currency,
              notes: fullInvoice.notes || '',
              terms: fullInvoice.terms || '',
              discount_amount: Number(fullInvoice.discount_amount) || 0,
            });
            setItems(
              fullInvoice.invoice_items?.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                tax_rate: Number(item.tax_rate),
                amount: Number(item.amount),
              })) || []
            );
          }
        } catch (error) {
          console.error('Error loading invoice:', error);
        } finally {
          setIsLoadingInvoice(false);
        }
      } else if (!invoice && open) {
        form.reset({
          customer_id: null,
          issue_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          currency: selectedCompany?.currency || 'NPR',
          notes: '',
          terms: 'Payment due within 30 days.',
          discount_amount: 0,
        });
        setItems([]);
      }
    };

    loadInvoice();
  }, [invoice, open, form, selectedCompany, getInvoiceWithItems]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = items.reduce((sum, item) => {
      const itemBase = item.quantity * item.unit_price;
      return sum + (itemBase * (item.tax_rate / 100));
    }, 0);
    const discountAmount = form.watch('discount_amount') || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, discountAmount, totalAmount };
  }, [items, form.watch('discount_amount')]);

  const onSubmit = async (data: InvoiceFormData) => {
    if (items.length === 0) {
      form.setError('root', { message: 'At least one item is required' });
      return;
    }

    try {
      if (isEditing && invoice) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          customer_id: data.customer_id,
          issue_date: format(data.issue_date, 'yyyy-MM-dd'),
          due_date: format(data.due_date, 'yyyy-MM-dd'),
          currency: data.currency,
          notes: data.notes || null,
          terms: data.terms || null,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          discount_amount: totals.discountAmount,
          total_amount: totals.totalAmount,
          items,
        });
      } else {
        await createInvoice.mutateAsync({
          customer_id: data.customer_id,
          issue_date: format(data.issue_date, 'yyyy-MM-dd'),
          due_date: format(data.due_date, 'yyyy-MM-dd'),
          currency: data.currency,
          notes: data.notes || null,
          terms: data.terms || null,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          discount_amount: totals.discountAmount,
          total_amount: totals.totalAmount,
          items,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const currency = form.watch('currency');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          </DialogHeader>

          {isLoadingInvoice ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading invoice...</div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <CustomerSelect
                            value={field.value}
                            onChange={field.onChange}
                            onCreateNew={() => setCustomerDialogOpen(true)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <Popover modal={false}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover modal={false}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Currency */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="w-48">
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                              {curr.code} - {curr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Line Items */}
                <div>
                  <FormLabel>Items</FormLabel>
                  <div className="mt-2">
                    <InvoiceItemsEditor items={items} onChange={setItems} currency={currency} />
                  </div>
                  {form.formState.errors.root && (
                    <p className="text-sm text-destructive mt-2">{form.formState.errors.root.message}</p>
                  )}
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{currency} {formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>{currency} {formatCurrency(totals.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Discount:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{currency}</span>
                        <FormField
                          control={form.control}
                          name="discount_amount"
                          render={({ field }) => (
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              className="w-24 h-8 text-right"
                              min="0"
                              step="0.01"
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>{currency} {formatCurrency(totals.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes and Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes for the customer..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Payment terms and conditions..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvoice.isPending || updateInvoice.isPending}
                  >
                    {isEditing ? 'Update' : 'Create'} Invoice
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSuccess={(customer) => {
          form.setValue('customer_id', customer.id);
        }}
      />
    </>
  );
}
