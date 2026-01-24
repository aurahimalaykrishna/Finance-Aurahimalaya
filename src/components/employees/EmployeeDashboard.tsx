import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Employee } from '@/hooks/useEmployees';
import { PayrollRun } from '@/hooks/usePayroll';
import { Users, UserCheck, Clock, Banknote } from 'lucide-react';

interface EmployeeDashboardProps {
  employees: Employee[];
  activeEmployees: Employee[];
  employeesOnProbation: Employee[];
  latestPayroll?: PayrollRun | null;
  totalMonthlyPayroll?: number;
}

export function EmployeeDashboard({
  employees,
  activeEmployees,
  employeesOnProbation,
  latestPayroll,
  totalMonthlyPayroll = 0,
}: EmployeeDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total basic salary for active employees
  const estimatedMonthlyPayroll = activeEmployees.reduce(
    (sum, emp) => sum + Number(emp.basic_salary) + Number(emp.dearness_allowance || 0),
    0
  );

  const stats = [
    {
      title: 'Total Employees',
      value: employees.length,
      icon: Users,
      description: `${employees.length - activeEmployees.length} inactive`,
      color: 'text-blue-500',
    },
    {
      title: 'Active Employees',
      value: activeEmployees.length,
      icon: UserCheck,
      description: `${Math.round((activeEmployees.length / employees.length) * 100) || 0}% of total`,
      color: 'text-green-500',
    },
    {
      title: 'On Probation',
      value: employeesOnProbation.length,
      icon: Clock,
      description: 'Within 6 months',
      color: 'text-yellow-500',
    },
    {
      title: 'Est. Monthly Payroll',
      value: formatCurrency(totalMonthlyPayroll || estimatedMonthlyPayroll),
      icon: Banknote,
      description: latestPayroll ? `Last run: Month ${latestPayroll.month}` : 'Not processed',
      color: 'text-primary',
      isLarge: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`font-bold ${stat.isLarge ? 'text-xl' : 'text-2xl'}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
