import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { MyPayslip } from '@/hooks/useMyPayslips';
import { MyEmployee } from '@/hooks/useMyEmployee';
import { format } from 'date-fns';

interface PayslipDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: MyPayslip | null;
  employee: MyEmployee;
}

const MONTH_NAMES = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export function PayslipDetailDialog({
  open,
  onOpenChange,
  payslip,
  employee,
}: PayslipDetailDialogProps) {
  if (!payslip) return null;

  const currency = employee.company?.currency || 'NPR';
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    return MONTH_NAMES[month - 1] || `Month ${month}`;
  };

  const periodLabel = payslip.payroll_run 
    ? `${getMonthName(payslip.payroll_run.month)} ${payslip.payroll_run.fiscal_year}`
    : format(new Date(payslip.created_at), 'MMMM yyyy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Payslip - {periodLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Employee:</span>
              <span className="ml-2 font-medium">{employee.full_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Employee Code:</span>
              <span className="ml-2 font-medium">{employee.employee_code || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Department:</span>
              <span className="ml-2 font-medium">{employee.department || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Designation:</span>
              <span className="ml-2 font-medium">{employee.designation || 'N/A'}</span>
            </div>
          </div>

          <Separator />

          {/* Earnings */}
          <div>
            <h4 className="font-medium mb-3">Earnings</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Basic Salary</span>
                <span>{formatCurrency(payslip.basic_salary)}</span>
              </div>
              {(payslip.dearness_allowance ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Dearness Allowance</span>
                  <span>{formatCurrency(payslip.dearness_allowance)}</span>
                </div>
              )}
              {(payslip.overtime_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Overtime ({payslip.overtime_hours}h)</span>
                  <span>{formatCurrency(payslip.overtime_amount)}</span>
                </div>
              )}
              {(payslip.festival_allowance ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Festival Allowance</span>
                  <span>{formatCurrency(payslip.festival_allowance)}</span>
                </div>
              )}
              {(payslip.other_allowances ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Other Allowances</span>
                  <span>{formatCurrency(payslip.other_allowances)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Gross Salary</span>
                <span>{formatCurrency(payslip.gross_salary)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div>
            <h4 className="font-medium mb-3">Deductions</h4>
            <div className="space-y-2">
              {(payslip.ssf_employee_contribution ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>SSF (Employee)</span>
                  <span className="text-destructive">-{formatCurrency(payslip.ssf_employee_contribution)}</span>
                </div>
              )}
              {(payslip.income_tax ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Income Tax</span>
                  <span className="text-destructive">-{formatCurrency(payslip.income_tax)}</span>
                </div>
              )}
              {(payslip.social_security_tax ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Social Security Tax</span>
                  <span className="text-destructive">-{formatCurrency(payslip.social_security_tax)}</span>
                </div>
              )}
              {(payslip.other_deductions ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Other Deductions</span>
                  <span className="text-destructive">-{formatCurrency(payslip.other_deductions)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total Deductions</span>
                <span className="text-destructive">-{formatCurrency(payslip.total_deductions)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Salary */}
          <div className="flex justify-between text-lg font-bold">
            <span>Net Salary</span>
            <span className="text-green-600 dark:text-green-400">
              {formatCurrency(payslip.net_salary)}
            </span>
          </div>

          {/* Attendance Summary */}
          {(payslip.working_days || payslip.present_days || payslip.leave_days) && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Attendance Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Working Days:</span>
                    <span className="ml-2 font-medium">{payslip.working_days || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Present Days:</span>
                    <span className="ml-2 font-medium">{payslip.present_days || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Leave Days:</span>
                    <span className="ml-2 font-medium">{payslip.leave_days || 0}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Employer Contribution (Info) */}
          {(payslip.ssf_employer_contribution ?? 0) > 0 && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <span>Employer SSF Contribution: </span>
                <span className="font-medium">{formatCurrency(payslip.ssf_employer_contribution)}</span>
                <span className="ml-1">(paid on your behalf)</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
