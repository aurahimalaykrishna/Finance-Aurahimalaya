import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Printer } from 'lucide-react';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

export function InvoicePreview({ open, onOpenChange, invoice }: InvoicePreviewProps) {
  const { getInvoiceWithItems } = useInvoices();
  const { selectedCompany } = useCompanyContext();
  const [fullInvoice, setFullInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInvoice = async () => {
      if (invoice && open) {
        setIsLoading(true);
        try {
          const data = await getInvoiceWithItems(invoice.id);
          setFullInvoice(data);
        } catch (error) {
          console.error('Error loading invoice:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadInvoice();
  }, [invoice, open, getInvoiceWithItems]);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${new Intl.NumberFormat('en-NP', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.invoice_number}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={isLoading || !fullInvoice}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={isLoading || !fullInvoice}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading invoice...</div>
          </div>
        ) : fullInvoice ? (
          <div ref={printRef} className="invoice-print-area space-y-6 p-4 bg-card rounded-lg border">
            {/* Header */}
            <div className="flex justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedCompany?.name || 'Your Company'}</h2>
                {selectedCompany?.address && (
                  <p className="text-muted-foreground text-sm mt-1">{selectedCompany.address}</p>
                )}
              </div>
              <div className="text-right">
                <h3 className="text-xl font-semibold">INVOICE</h3>
                <p className="text-lg text-primary">{fullInvoice.invoice_number}</p>
              </div>
            </div>

            <Separator />

            {/* Customer and Dates */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Bill To</h4>
                {fullInvoice.customer ? (
                  <div>
                    <p className="font-medium">{fullInvoice.customer.name}</p>
                    {fullInvoice.customer.email && (
                      <p className="text-sm text-muted-foreground">{fullInvoice.customer.email}</p>
                    )}
                    {fullInvoice.customer.phone && (
                      <p className="text-sm text-muted-foreground">{fullInvoice.customer.phone}</p>
                    )}
                    {fullInvoice.customer.address && (
                      <p className="text-sm text-muted-foreground mt-1">{fullInvoice.customer.address}</p>
                    )}
                    {fullInvoice.customer.tax_id && (
                      <p className="text-sm text-muted-foreground">Tax ID: {fullInvoice.customer.tax_id}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No customer assigned</p>
                )}
              </div>
              <div className="text-right">
                <div className="space-y-1">
                  <div className="flex justify-end gap-4">
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span className="font-medium">{format(new Date(fullInvoice.issue_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-end gap-4">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium">{format(new Date(fullInvoice.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {fullInvoice.paid_at && (
                    <div className="flex justify-end gap-4">
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="font-medium text-green-500">
                        {format(new Date(fullInvoice.paid_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground w-20">Qty</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground w-28">Unit Price</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground w-20">Tax</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {fullInvoice.invoice_items?.map((item, index) => (
                    <tr key={item.id || index} className="border-b">
                      <td className="py-3">{item.description}</td>
                      <td className="text-right py-3">{item.quantity}</td>
                      <td className="text-right py-3">
                        {formatCurrency(Number(item.unit_price), fullInvoice.currency)}
                      </td>
                      <td className="text-right py-3">{item.tax_rate}%</td>
                      <td className="text-right py-3 font-medium">
                        {formatCurrency(Number(item.amount), fullInvoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(Number(fullInvoice.subtotal), fullInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>{formatCurrency(Number(fullInvoice.tax_amount), fullInvoice.currency)}</span>
                </div>
                {Number(fullInvoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-destructive">
                      -{formatCurrency(Number(fullInvoice.discount_amount), fullInvoice.currency)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(Number(fullInvoice.total_amount), fullInvoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(fullInvoice.notes || fullInvoice.terms) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {fullInvoice.notes && (
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">Notes</h4>
                      <p className="whitespace-pre-wrap">{fullInvoice.notes}</p>
                    </div>
                  )}
                  {fullInvoice.terms && (
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">Payment Terms</h4>
                      <p className="whitespace-pre-wrap">{fullInvoice.terms}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
