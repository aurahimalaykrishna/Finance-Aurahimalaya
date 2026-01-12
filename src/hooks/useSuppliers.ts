import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Supplier {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  name: string;
  company_id: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  is_active?: boolean;
}

export interface SupplierStats {
  supplier_id: string;
  supplier_name: string;
  total_paid: number;
  total_received: number;
  net_balance: number;
  transaction_count: number;
}

export function useSuppliers(companyId?: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", companyId],
    queryFn: async () => {
      let query = supabase
        .from("suppliers")
        .select("*")
        .order("name", { ascending: true });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!user,
  });

  const { data: supplierStats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ["supplier-stats", companyId],
    queryFn: async () => {
      // Get all suppliers with their transactions
      let suppliersQuery = supabase
        .from("suppliers")
        .select("id, name");

      if (companyId) {
        suppliersQuery = suppliersQuery.eq("company_id", companyId);
      }

      const { data: suppliersData, error: suppliersError } = await suppliersQuery;
      if (suppliersError) throw suppliersError;

      // Get all transactions with supplier_id
      let transactionsQuery = supabase
        .from("transactions")
        .select("supplier_id, amount, type")
        .not("supplier_id", "is", null);

      if (companyId) {
        transactionsQuery = transactionsQuery.eq("company_id", companyId);
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;
      if (transactionsError) throw transactionsError;

      // Calculate stats for each supplier
      const stats: SupplierStats[] = (suppliersData || []).map((supplier) => {
        const supplierTransactions = (transactionsData || []).filter(
          (t) => t.supplier_id === supplier.id
        );

        const totalPaid = supplierTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalReceived = supplierTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          total_paid: totalPaid,
          total_received: totalReceived,
          net_balance: totalPaid - totalReceived,
          transaction_count: supplierTransactions.length,
        };
      });

      return stats;
    },
    enabled: !!user,
  });

  const createSupplier = useMutation({
    mutationFn: async (data: CreateSupplierData) => {
      const { data: result, error } = await supabase
        .from("suppliers")
        .insert({
          ...data,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
      toast({
        title: "Supplier created",
        description: "The supplier has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating supplier",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Supplier> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("suppliers")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
      toast({
        title: "Supplier updated",
        description: "The supplier has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating supplier",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
      toast({
        title: "Supplier deleted",
        description: "The supplier has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting supplier",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate totals from stats
  const totalPaid = supplierStats.reduce((sum, s) => sum + s.total_paid, 0);
  const totalReceived = supplierStats.reduce((sum, s) => sum + s.total_received, 0);
  const netBalance = totalPaid - totalReceived;

  return {
    suppliers,
    isLoading,
    supplierStats,
    isLoadingStats,
    totalPaid,
    totalReceived,
    netBalance,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
