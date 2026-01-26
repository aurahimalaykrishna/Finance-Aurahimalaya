import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import type { Customer } from './useCustomers';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
  created_at: string;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  company_id: string;
  customer_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer | null;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceInsert {
  customer_id?: string | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency?: string;
  notes?: string | null;
  terms?: string | null;
  items: InvoiceItemInput[];
}

export interface InvoiceUpdate {
  id: string;
  customer_id?: string | null;
  issue_date?: string;
  due_date?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  currency?: string;
  notes?: string | null;
  terms?: string | null;
  status?: InvoiceStatus;
  items?: InvoiceItemInput[];
}

export function useInvoices() {
  const { user } = useAuth();
  const { selectedCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['invoices', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('company_id', selectedCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user && !!selectedCompanyId,
  });

  const getInvoiceWithItems = async (invoiceId: string): Promise<Invoice | null> => {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at');

    if (itemsError) throw itemsError;

    return { ...invoice, invoice_items: items } as Invoice;
  };

  const generateInvoiceNumber = async (): Promise<string> => {
    if (!selectedCompanyId) throw new Error('No company selected');

    const { data, error } = await supabase
      .rpc('generate_invoice_number', { p_company_id: selectedCompanyId });

    if (error) throw error;
    return data as string;
  };

  const createInvoice = useMutation({
    mutationFn: async (invoice: InvoiceInsert) => {
      if (!user || !selectedCompanyId) throw new Error('Not authenticated or no company selected');

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();

      // Create invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          company_id: selectedCompanyId,
          customer_id: invoice.customer_id,
          invoice_number: invoiceNumber,
          status: 'draft',
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          subtotal: invoice.subtotal,
          tax_amount: invoice.tax_amount,
          discount_amount: invoice.discount_amount,
          total_amount: invoice.total_amount,
          currency: invoice.currency || 'NPR',
          notes: invoice.notes,
          terms: invoice.terms,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (invoice.items.length > 0) {
        const itemsToInsert = invoice.items.map((item) => ({
          invoice_id: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return newInvoice as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', selectedCompanyId] });
      toast.success('Invoice created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create invoice: ' + error.message);
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, items, ...updates }: InvoiceUpdate) => {
      // Update invoice
      const { data: updatedInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // If items provided, replace all items
      if (items) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id);

        if (deleteError) throw deleteError;

        // Insert new items
        if (items.length > 0) {
          const itemsToInsert = items.map((item) => ({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            amount: item.amount,
          }));

          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      return updatedInvoice as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', selectedCompanyId] });
      toast.success('Invoice updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update invoice: ' + error.message);
    },
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', selectedCompanyId] });
      toast.success(`Invoice marked as ${data.status}`);
    },
    onError: (error) => {
      toast.error('Failed to update invoice status: ' + error.message);
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', selectedCompanyId] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete invoice: ' + error.message);
    },
  });

  // Calculate invoice statistics
  const stats = {
    draft: invoicesQuery.data?.filter((i) => i.status === 'draft') ?? [],
    sent: invoicesQuery.data?.filter((i) => i.status === 'sent') ?? [],
    paid: invoicesQuery.data?.filter((i) => i.status === 'paid') ?? [],
    overdue: invoicesQuery.data?.filter((i) => i.status === 'overdue') ?? [],
    cancelled: invoicesQuery.data?.filter((i) => i.status === 'cancelled') ?? [],
    totalDraft: invoicesQuery.data?.filter((i) => i.status === 'draft').reduce((sum, i) => sum + Number(i.total_amount), 0) ?? 0,
    totalSent: invoicesQuery.data?.filter((i) => i.status === 'sent').reduce((sum, i) => sum + Number(i.total_amount), 0) ?? 0,
    totalPaid: invoicesQuery.data?.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount), 0) ?? 0,
    totalOverdue: invoicesQuery.data?.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + Number(i.total_amount), 0) ?? 0,
  };

  return {
    invoices: invoicesQuery.data ?? [],
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    stats,
    getInvoiceWithItems,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
  };
}
