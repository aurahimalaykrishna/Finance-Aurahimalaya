import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { InvoiceDialog } from '@/components/invoices/InvoiceDialog';
import { useCompanyContext } from '@/contexts/CompanyContext';

export default function Invoices() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { selectedCompanyId, isAllCompanies } = useCompanyContext();

  if (isAllCompanies) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-lg font-medium mb-2">Select a Company</h2>
          <p className="text-muted-foreground">
            Please select a specific company to view and manage invoices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Create and manage invoices for your customers</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <InvoiceList onCreateNew={() => setCreateDialogOpen(true)} />

      <InvoiceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
