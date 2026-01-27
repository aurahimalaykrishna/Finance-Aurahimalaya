import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendancePanel } from '@/components/employees/AttendancePanel';
import { useEmployeeLeaves } from '@/hooks/useEmployeeLeaves';
import { useCompanyHolidays } from '@/hooks/useCompanyHolidays';
import { MyEmployee } from '@/hooks/useMyEmployee';
import { Calendar, Briefcase, Building2 } from 'lucide-react';

interface PortalDashboardProps {
  employee: MyEmployee;
}

export function PortalDashboard({ employee }: PortalDashboardProps) {
  const { leaveBalance, calculateAvailableLeave, fiscalYear } = useEmployeeLeaves(employee.id);
  const { upcomingHolidays } = useCompanyHolidays(employee.company_id);
  
  const availableLeave = calculateAvailableLeave(leaveBalance, employee.gender);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Attendance Card */}
      <AttendancePanel 
        employeeId={employee.id} 
        employeeName={employee.full_name}
        showNotes={true}
      />

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{employee.company?.name || 'N/A'}</p>
            </div>
          </div>

          {employee.department && (
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{employee.department}</p>
              </div>
            </div>
          )}

          {employee.designation && (
            <div>
              <p className="text-sm text-muted-foreground">Designation</p>
              <p className="font-medium">{employee.designation}</p>
            </div>
          )}

          {availableLeave && (
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-medium">Leave Balances (FY {fiscalYear})</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Home Leave:</span>
                  <span className="font-medium">{availableLeave.homeLeave.available} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sick Leave:</span>
                  <span className="font-medium">{availableLeave.sickLeave.available} days</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Holidays */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingHolidays.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming holidays</p>
          ) : (
            <div className="space-y-3">
              {upcomingHolidays.slice(0, 5).map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{holiday.name}</p>
                    {holiday.description && (
                      <p className="text-sm text-muted-foreground">{holiday.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(holiday.date), 'EEEE, MMM d, yyyy')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
