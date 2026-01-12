import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { getCurrencySymbol } from "@/lib/currencies";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function SupplierDashboard() {
  const { selectedCompany } = useCompanyContext();
  const {
    suppliers,
    supplierStats,
    totalPaid,
    totalReceived,
    netBalance,
    isLoading,
  } = useSuppliers(selectedCompany?.id);

  const currencySymbol = getCurrencySymbol(selectedCompany?.currency || "NPR");

  // Get top 5 suppliers by total paid
  const topSuppliers = [...supplierStats]
    .sort((a, b) => b.total_paid - a.total_paid)
    .slice(0, 5);

  const chartData = topSuppliers.map((s) => ({
    name: s.supplier_name.length > 15 
      ? s.supplier_name.slice(0, 15) + "..." 
      : s.supplier_name,
    paid: s.total_paid,
    received: s.total_received,
  }));

  const activeSuppliers = suppliers.filter((s) => s.is_active).length;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {currencySymbol} {totalPaid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Payments to suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {currencySymbol} {totalReceived.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Credits & refunds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance > 0 ? 'text-destructive' : 'text-green-500'}`}>
              {currencySymbol} {netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paid minus received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {suppliers.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Suppliers by Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120} 
                    className="text-xs"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      `${currencySymbol} ${value.toLocaleString()}`,
                    ]}
                  />
                  <Bar 
                    dataKey="paid" 
                    name="Paid" 
                    fill="hsl(var(--destructive))" 
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="received" 
                    name="Received" 
                    fill="hsl(142.1 76.2% 36.3%)" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
