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
          <div ref={printRef} className="invoice-print-area space-y-8 p-8 bg-white rounded-lg border print:border-0 print:shadow-none">
            {/* Header with branding */}
            <div className="flex justify-between items-start border-b-2 border-primary pb-6">
              <div className="space-y-2">
                {selectedCompany?.logo_url ? (
                  <img 
                    src={selectedCompany.logo_url} 
                    alt={selectedCompany.name} 
                    className="h-16 w-auto object-contain mb-2"
                  />
                ) : null}
                <h2 className="text-2xl font-bold text-foreground">{selectedCompany?.name || 'Company Name'}</h2>
                {selectedCompany?.address && (
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{selectedCompany.address}</p>
                )}
              </div>
              <div className="text-right space-y-1">
                <h3 className="text-3xl font-bold text-primary tracking-tight">INVOICE</h3>
                <p className="text-xl font-semibold text-foreground">{fullInvoice.invoice_number}</p>
                <InvoiceStatusBadge status={fullInvoice.status} />
              </div>
            </div>

            {/* Customer and Dates */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bill To</h4>
                {fullInvoice.customer ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-lg text-foreground">{fullInvoice.customer.name}</p>
                    {fullInvoice.customer.address && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{fullInvoice.customer.address}</p>
                    )}
                    {fullInvoice.customer.email && (
                      <p className="text-sm text-muted-foreground">{fullInvoice.customer.email}</p>
                    )}
                    {fullInvoice.customer.phone && (
                      <p className="text-sm text-muted-foreground">{fullInvoice.customer.phone}</p>
                    )}
                    {fullInvoice.customer.tax_id && (
                      <p className="text-sm text-muted-foreground">Tax ID: {fullInvoice.customer.tax_id}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No customer assigned</p>
                )}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span className="font-medium text-foreground">{format(new Date(fullInvoice.issue_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium text-foreground">{format(new Date(fullInvoice.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {fullInvoice.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid On:</span>
                      <span className="font-medium text-success">
                        {format(new Date(fullInvoice.paid_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Qty</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Unit Price</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Tax %</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fullInvoice.invoice_items?.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-muted/30">
                      <td className="py-3 px-4 text-foreground">{item.description}</td>
                      <td className="text-center py-3 px-4 text-foreground">{item.quantity}</td>
                      <td className="text-right py-3 px-4 text-foreground">
                        {formatCurrency(Number(item.unit_price), fullInvoice.currency)}
                      </td>
                      <td className="text-center py-3 px-4 text-foreground">{item.tax_rate}%</td>
                      <td className="text-right py-3 px-4 font-medium text-foreground">
                        {formatCurrency(Number(item.amount), fullInvoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2 bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">{formatCurrency(Number(fullInvoice.subtotal), fullInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="text-foreground">{formatCurrency(Number(fullInvoice.tax_amount), fullInvoice.currency)}</span>
                </div>
                {Number(fullInvoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-destructive">
                      -{formatCurrency(Number(fullInvoice.discount_amount), fullInvoice.currency)}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total:</span>
                  <span className="text-primary">{formatCurrency(Number(fullInvoice.total_amount), fullInvoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(fullInvoice.notes || fullInvoice.terms) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                {fullInvoice.notes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{fullInvoice.notes}</p>
                  </div>
                )}
                {fullInvoice.terms && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Terms</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{fullInvoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-6 border-t text-xs text-muted-foreground">
              <p>Thank you for your business!</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
