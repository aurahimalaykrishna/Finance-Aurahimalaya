import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CompanyLeaveType } from '@/hooks/useCompanyLeaveTypes';
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
  leaveTypes?: CompanyLeaveType[];
}

// Helper to get leave data for a leave type code
const getLeaveDataForType = (code: string, availableLeave: AvailableLeave) => {
  const mapping: Record<string, keyof AvailableLeave> = {
    home: 'homeLeave',
    sick: 'sickLeave',
    maternity: 'maternityLeave',
    paternity: 'paternityLeave',
    mourning: 'mourningLeave',
    public_holiday: 'publicHolidays',
  };
  return availableLeave[mapping[code] || 'homeLeave'] || { accrued: 0, used: 0, available: 0 };
};

export function LeaveBalanceCard({
  fiscalYear,
  availableLeave,
  gender,
  leaveTypes: companyLeaveTypes,
}: LeaveBalanceCardProps) {
  // Build display leave types from company configuration or fallback to defaults
  const displayLeaveTypes = companyLeaveTypes && companyLeaveTypes.length > 0
    ? companyLeaveTypes
        .filter(lt => lt.is_active)
        .filter(lt => !lt.gender_restriction || lt.gender_restriction === gender)
        .map(lt => ({
          name: lt.name,
          code: lt.code,
          data: getLeaveDataForType(lt.code, availableLeave),
          maxLimit: lt.max_accrual || lt.annual_entitlement,
          showCarryForward: (lt.max_carry_forward || 0) > 0,
          color: lt.color || '#6366f1',
        }))
    : [
        { name: 'Home Leave', code: 'home', data: availableLeave.homeLeave, maxLimit: 90, showCarryForward: true, color: '#3b82f6' },
        { name: 'Sick Leave', code: 'sick', data: availableLeave.sickLeave, maxLimit: 45, showCarryForward: true, color: '#ef4444' },
        ...(gender === 'female' ? [{ name: 'Maternity Leave', code: 'maternity', data: availableLeave.maternityLeave, maxLimit: 60, showCarryForward: false, color: '#ec4899' }] : []),
        ...(gender === 'male' ? [{ name: 'Paternity Leave', code: 'paternity', data: availableLeave.paternityLeave, maxLimit: 15, showCarryForward: false, color: '#8b5cf6' }] : []),
        { name: 'Mourning Leave', code: 'mourning', data: availableLeave.mourningLeave, maxLimit: 13, showCarryForward: false, color: '#6b7280' },
        { name: 'Public Holidays', code: 'public_holiday', data: availableLeave.publicHolidays, maxLimit: availableLeave.publicHolidays.entitled || 13, showCarryForward: false, color: '#22c55e' },
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
          {displayLeaveTypes.map((leave) => {
            const total = (leave.data.accrued || leave.data.entitled || 0) + (leave.data.carryForward || 0);
            const usedPercentage = total > 0 ? (leave.data.used / total) * 100 : 0;

            return (
              <div key={leave.code} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: leave.color }}
                    />
                    <span className="font-medium">{leave.name}</span>
                  </div>
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

        {/* Dynamic entitlements info based on company leave types */}
        {companyLeaveTypes && companyLeaveTypes.length > 0 ? (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Company Leave Entitlements</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {companyLeaveTypes
                .filter(lt => lt.is_active)
                .filter(lt => !lt.gender_restriction || lt.gender_restriction === gender)
                .map(lt => (
                  <li key={lt.id}>
                    • {lt.name}: {lt.annual_entitlement} days/year
                    {lt.max_accrual && ` (max ${lt.max_accrual} days accrual)`}
                    {lt.max_carry_forward ? ` (carry forward up to ${lt.max_carry_forward} days)` : ''}
                  </li>
                ))}
            </ul>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
