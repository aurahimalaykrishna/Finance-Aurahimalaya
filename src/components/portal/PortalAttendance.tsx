import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendancePanel } from '@/components/employees/AttendancePanel';
import { AttendanceCalendar } from '@/components/employees/AttendanceCalendar';
import { MyEmployee } from '@/hooks/useMyEmployee';
import { TrendingUp } from 'lucide-react';

interface PortalAttendanceProps {
  employee: MyEmployee;
}

export function PortalAttendance({ employee }: PortalAttendanceProps) {
  return (
    <div className="space-y-6">
      {/* Today's Attendance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AttendancePanel 
          employeeId={employee.id} 
          employeeName={employee.full_name}
          showNotes={true}
        />

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Attendance Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Check in when you arrive and check out before leaving</p>
            <p>• Overtime is calculated for hours worked beyond 8 hours/day</p>
            <p>• A 1-hour lunch break is automatically deducted for shifts over 6 hours</p>
            <p>• Leave days are automatically recorded when your leave is approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Calendar */}
      <AttendanceCalendar employeeId={employee.id} />
    </div>
  );
}
