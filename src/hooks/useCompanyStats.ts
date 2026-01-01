import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CompanyStats {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  bankAccountsCount: number;
  bankAccountsTotal: number;
  categoriesCount: { income: number; expense: number };
  activeBudgetsCount: number;
  recentTransactions: any[];
}

export function useCompanyStats(companyId: string | undefined) {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["company-stats", companyId],
    queryFn: async (): Promise<CompanyStats> => {
      if (!user || !companyId) {
        return {
          totalTransactions: 0,
          totalIncome: 0,
          totalExpense: 0,
          netBalance: 0,
          bankAccountsCount: 0,
          bankAccountsTotal: 0,
          categoriesCount: { income: 0, expense: 0 },
          activeBudgetsCount: 0,
          recentTransactions: [],
        };
      }

      // Fetch transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", user.id);

      const incomeTotal = transactions?.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const expenseTotal = transactions?.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch bank accounts
      const { data: bankAccounts } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", user.id);

      const bankAccountsTotal = bankAccounts?.reduce((sum, ba) => sum + Number(ba.current_balance || 0), 0) || 0;

      // Fetch categories
      const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", user.id);

      const incomeCategories = categories?.filter(c => c.type === "income").length || 0;
      const expenseCategories = categories?.filter(c => c.type === "expense").length || 0;

      // Fetch budgets
      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", user.id);

      // Fetch recent transactions
      const { data: recentTransactions } = await supabase
        .from("transactions")
        .select("*, categories(name, color, icon)")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(10);

      return {
        totalTransactions: transactions?.length || 0,
        totalIncome: incomeTotal,
        totalExpense: expenseTotal,
        netBalance: incomeTotal - expenseTotal,
        bankAccountsCount: bankAccounts?.length || 0,
        bankAccountsTotal,
        categoriesCount: { income: incomeCategories, expense: expenseCategories },
        activeBudgetsCount: budgets?.length || 0,
        recentTransactions: recentTransactions || [],
      };
    },
    enabled: !!user && !!companyId,
  });

  return {
    stats: stats || {
      totalTransactions: 0,
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      bankAccountsCount: 0,
      bankAccountsTotal: 0,
      categoriesCount: { income: 0, expense: 0 },
      activeBudgetsCount: 0,
      recentTransactions: [],
    },
    isLoading,
  };
}
