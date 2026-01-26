import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VATReturnData {
  totalVAT: number;
  paidVAT: number;
  pendingVAT: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  pendingInvoiceCount: number;
}

export function useVATReturn(companyId: string | null) {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['vat-return', companyId],
    queryFn: async (): Promise<VATReturnData> => {
      if (!user) {
        return {
          totalVAT: 0,
          paidVAT: 0,
          pendingVAT: 0,
          invoiceCount: 0,
          paidInvoiceCount: 0,
          pendingInvoiceCount: 0,
        };
      }

      let query = supabase
        .from('invoices')
        .select('tax_amount, status');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      const allInvoices = invoices || [];
      const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
      const pendingInvoices = allInvoices.filter(inv => inv.status !== 'paid');

      const totalVAT = allInvoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);
      const paidVAT = paidInvoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);
      const pendingVAT = pendingInvoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);

      return {
        totalVAT,
        paidVAT,
        pendingVAT,
        invoiceCount: allInvoices.length,
        paidInvoiceCount: paidInvoices.length,
        pendingInvoiceCount: pendingInvoices.length,
      };
    },
    enabled: !!user,
  });

  return {
    vatData: data || {
      totalVAT: 0,
      paidVAT: 0,
      pendingVAT: 0,
      invoiceCount: 0,
      paidInvoiceCount: 0,
      pendingInvoiceCount: 0,
    },
    isLoading,
    error,
  };
}
