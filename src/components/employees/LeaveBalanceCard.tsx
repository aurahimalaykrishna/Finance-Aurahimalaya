import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  HOME_LEAVE_MAX_ACCRUAL,
  SICK_LEAVE_MAX_ACCRUAL,
  MATERNITY_PAID_DAYS,
  PATERNITY_LEAVE_DAYS,
  MOURNING_LEAVE_DAYS,
} from '@/lib/nepal-hr-calculations';
import { Calendar } from 'lucide-react';

interface LeaveBalance {
  accrued?: number;
  entitled?: number;
  carryForward?: number;
  used: number;
  available: number;
}

interface AvailableLeave {
  homeLeave: LeaveBalance;
  sickLeave: LeaveBalance;
  maternityLeave: LeaveBalance;
  paternityLeave: LeaveBalance;
  mourningLeave: LeaveBalance;
  publicHolidays: LeaveBalance;
}

interface LeaveBalanceCardProps {
  fiscalYear: string;
  availableLeave: AvailableLeave;
  gender: string;
}

export function LeaveBalanceCard({
  fiscalYear,
  availableLeave,
  gender,
}: LeaveBalanceCardProps) {
  const leaveTypes = [
    {
      name: 'Home Leave',
      data: availableLeave.homeLeave,
      maxLimit: HOME_LEAVE_MAX_ACCRUAL,
      showCarryForward: true,
      color: 'bg-blue-500',
    },
    {
      name: 'Sick Leave',
      data: availableLeave.sickLeave,
      maxLimit: SICK_LEAVE_MAX_ACCRUAL,
      showCarryForward: true,
      color: 'bg-red-500',
    },
    ...(gender === 'female' ? [{
      name: 'Maternity Leave',
      data: availableLeave.maternityLeave,
      maxLimit: MATERNITY_PAID_DAYS,
      showCarryForward: false,
      color: 'bg-pink-500',
    }] : []),
    ...(gender === 'male' ? [{
      name: 'Paternity Leave',
      data: availableLeave.paternityLeave,
      maxLimit: PATERNITY_LEAVE_DAYS,
      showCarryForward: false,
      color: 'bg-indigo-500',
    }] : []),
    {
      name: 'Mourning Leave',
      data: availableLeave.mourningLeave,
      maxLimit: MOURNING_LEAVE_DAYS,
      showCarryForward: false,
      color: 'bg-gray-500',
    },
    {
      name: 'Public Holidays',
      data: availableLeave.publicHolidays,
      maxLimit: availableLeave.publicHolidays.entitled || 13,
      showCarryForward: false,
      color: 'bg-green-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Leave Balances - FY {fiscalYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {leaveTypes.map((leave) => {
            const total = (leave.data.accrued || leave.data.entitled || 0) + (leave.data.carryForward || 0);
            const usedPercentage = total > 0 ? (leave.data.used / total) * 100 : 0;

            return (
              <div key={leave.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{leave.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {leave.data.available} days available
                  </span>
                </div>
                
                <Progress value={usedPercentage} className="h-2" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    {leave.data.accrued !== undefined && (
                      <span>Accrued: {leave.data.accrued}</span>
                    )}
                    {leave.data.entitled !== undefined && (
                      <span>Entitled: {leave.data.entitled}</span>
                    )}
                    {leave.showCarryForward && leave.data.carryForward !== undefined && (
                      <span>Carry Forward: {leave.data.carryForward}</span>
                    )}
                  </div>
                  <span>Used: {leave.data.used}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Nepal Labour Act 2074 Entitlements</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Home Leave: 1 day per 20 working days (max 90 days accrual)</li>
            <li>• Sick Leave: 12 days/year proportionate (max 45 days accrual)</li>
            <li>• Public Holidays: 13 days (14 for women)</li>
            {gender === 'female' && (
              <li>• Maternity Leave: 14 weeks (60 days fully paid)</li>
            )}
            {gender === 'male' && (
              <li>• Paternity Leave: 15 days fully paid</li>
            )}
            <li>• Mourning Leave: 13 days fully paid</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
