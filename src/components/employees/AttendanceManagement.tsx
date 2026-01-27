import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAttendance, AttendanceLog } from '@/hooks/useAttendance';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { AttendanceDialog } from './AttendanceDialog';
import { CalendarIcon, Clock, LogIn, LogOut, Search, Loader2, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeAttendance {
  employee: Employee;
  attendance?: AttendanceLog;
}

const STATUS_BADGES: Record<string, { className: string; label: string }> = {
  present: { className: 'bg-green-500/10 text-green-600 dark:text-green-400', label: 'Present' },
  absent: { className: 'bg-red-500/10 text-red-600 dark:text-red-400', label: 'Absent' },
  leave: { className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', label: 'On Leave' },
  half_day: { className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', label: 'Half Day' },
  holiday: { className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', label: 'Holiday' },
  weekend: { className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400', label: 'Weekend' },
  not_marked: { className: 'bg-muted text-muted-foreground', label: 'Not Marked' },
};

export function AttendanceManagement() {
  const { selectedCompanyId } = useCompanyContext();
  const { activeEmployees, isLoading: employeesLoading } = useEmployees();
  const { getCompanyAttendanceByDate, markAsHoliday, checkIn } = useAttendance();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    employee: Employee | null;
    date: Date;
    record?: AttendanceLog;
  }>({ open: false, employee: null, date: new Date() });

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedCompanyId || activeEmployees.length === 0) return;
      
      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const records = await getCompanyAttendanceByDate(selectedCompanyId, dateStr);
        
        const data: EmployeeAttendance[] = activeEmployees.map(employee => ({
          employee,
          attendance: records.find(r => r.employee_id === employee.id),
        }));
        
        setAttendanceData(data);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedCompanyId, selectedDate, activeEmployees, getCompanyAttendanceByDate]);

  const filteredData = attendanceData.filter(item =>
    item.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employee.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employee.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkHoliday = () => {
    const employeeIds = activeEmployees.map(e => e.id);
    markAsHoliday.mutate({ 
      employeeIds, 
      date: format(selectedDate, 'yyyy-MM-dd')
    });
  };

  const handleQuickCheckIn = (employee: Employee) => {
    checkIn.mutate({ employeeId: employee.id });
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--';
    return format(new Date(timestamp), 'hh:mm a');
  };

  const formatHours = (hours: number) => {
    if (!hours) return '-';
    return `${hours.toFixed(1)}h`;
  };

  const getStatusBadge = (attendance?: AttendanceLog) => {
    const status = attendance?.status || 'not_marked';
    const config = STATUS_BADGES[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Summary stats
  const summary = {
    present: filteredData.filter(d => d.attendance?.status === 'present').length,
    absent: filteredData.filter(d => d.attendance?.status === 'absent').length,
    leave: filteredData.filter(d => d.attendance?.status === 'leave').length,
    notMarked: filteredData.filter(d => !d.attendance).length,
  };

  return (
    <div className="space-y-4">
      {/* Header with date picker and actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleMarkHoliday}
          disabled={markAsHoliday.isPending}
        >
          <Flag className="mr-2 h-4 w-4" />
          Mark as Holiday
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.present}
            </div>
            <div className="text-xs text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.absent}
            </div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.leave}
            </div>
            <div className="text-xs text-muted-foreground">On Leave</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {summary.notMarked}
            </div>
            <div className="text-xs text-muted-foreground">Not Marked</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Attendance for {format(selectedDate, 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading || employeesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No employees found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(({ employee, attendance }) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {employee.employee_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>{getStatusBadge(attendance)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <LogIn className="h-3 w-3 text-muted-foreground" />
                          {formatTime(attendance?.check_in ?? null)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <LogOut className="h-3 w-3 text-muted-foreground" />
                          {formatTime(attendance?.check_out ?? null)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatHours(attendance?.working_hours || 0)}
                          {(attendance?.overtime_hours || 0) > 0 && (
                            <span className="text-orange-500 ml-1">
                              +{formatHours(attendance!.overtime_hours)}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditDialog({
                            open: true,
                            employee,
                            date: selectedDate,
                            record: attendance,
                          })}
                        >
                          {attendance ? 'Edit' : 'Add'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editDialog.employee && (
        <AttendanceDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}
          employeeId={editDialog.employee.id}
          employeeName={editDialog.employee.full_name}
          date={editDialog.date}
          existingRecord={editDialog.record}
        />
      )}
    </div>
  );
}
