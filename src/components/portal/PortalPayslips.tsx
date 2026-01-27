import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useMyPayslips, MyPayslip } from '@/hooks/useMyPayslips';
import { PayslipDetailDialog } from '@/components/portal/PayslipDetailDialog';
import { MyEmployee } from '@/hooks/useMyEmployee';
import { format } from 'date-fns';
import { Receipt, Eye, Loader2 } from 'lucide-react';

interface PortalPayslipsProps {
  employee: MyEmployee;
}

const MONTH_NAMES = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export function PortalPayslips({ employee }: PortalPayslipsProps) {
  const { payslips, isLoading } = useMyPayslips(employee.id);
  const [selectedPayslip, setSelectedPayslip] = useState<MyPayslip | null>(null);

  const formatCurrency = (amount: number) => {
    const currency = employee.company?.currency || 'NPR';
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    return MONTH_NAMES[month - 1] || `Month ${month}`;
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'finalized':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Finalized</Badge>;
      case 'processed':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">Processed</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            My Payslips
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payslips found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your payslips will appear here once they are processed.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross Salary</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {payslip.payroll_run 
                        ? `${getMonthName(payslip.payroll_run.month)} ${payslip.payroll_run.fiscal_year}`
                        : format(new Date(payslip.created_at), 'MMMM yyyy')
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payslip.gross_salary)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      -{formatCurrency(payslip.total_deductions)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payslip.net_salary)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payslip.payroll_run?.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayslip(payslip)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payslip Detail Dialog */}
      <PayslipDetailDialog
        open={!!selectedPayslip}
        onOpenChange={(open) => !open && setSelectedPayslip(null)}
        payslip={selectedPayslip}
        employee={employee}
      />
    </div>
  );
}
