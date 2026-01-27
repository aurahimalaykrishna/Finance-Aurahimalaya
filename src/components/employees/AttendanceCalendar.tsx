import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAttendance, AttendanceLog, calculateMonthlyStats, MonthlyStats } from '@/hooks/useAttendance';
import { ChevronLeft, ChevronRight, Calendar, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceCalendarProps {
  employeeId: string;
  onDayClick?: (date: Date, attendance?: AttendanceLog) => void;
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-500 dark:bg-green-600',
  absent: 'bg-red-500 dark:bg-red-600',
  leave: 'bg-blue-500 dark:bg-blue-600',
  half_day: 'bg-yellow-500 dark:bg-yellow-600',
  holiday: 'bg-purple-500 dark:bg-purple-600',
  weekend: 'bg-gray-400 dark:bg-gray-600',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AttendanceCalendar({ employeeId, onDayClick }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceLog[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { getMonthlyAttendance } = useAttendance(employeeId);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!employeeId) return;
      
      setLoading(true);
      try {
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        const records = await getMonthlyAttendance(employeeId, month, year);
        setMonthlyRecords(records);
        setStats(calculateMonthlyStats(records));
      } catch (error) {
        console.error('Error fetching monthly attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [employeeId, currentMonth, getMonthlyAttendance]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getAttendanceForDay = (date: Date): AttendanceLog | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return monthlyRecords.find(r => r.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatHours = (hours: number) => {
    if (!hours) return '0h';
    return `${Math.round(hours)}h`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Attendance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-32 text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          
          {/* Empty cells for days before month start */}
          {Array.from({ length: startDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-10" />
          ))}
          
          {/* Day cells */}
          {daysInMonth.map(day => {
            const attendance = getAttendanceForDay(day);
            const dayOfWeek = getDay(day);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDayClick?.(day, attendance)}
                className={cn(
                  'h-10 rounded-md text-sm relative flex flex-col items-center justify-center transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isToday(day) && 'ring-2 ring-primary',
                  !isSameMonth(day, currentMonth) && 'text-muted-foreground/50'
                )}
              >
                <span>{format(day, 'd')}</span>
                {attendance && (
                  <span
                    className={cn(
                      'absolute bottom-1 w-2 h-2 rounded-full',
                      STATUS_COLORS[attendance.status]
                    )}
                  />
                )}
                {!attendance && isWeekend && (
                  <span className="absolute bottom-1 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Half Day</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Holiday</span>
          </div>
        </div>

        {/* Monthly Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
            <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats.presentDays}
              </div>
              <div className="text-xs text-muted-foreground">Present</div>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-md">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {stats.absentDays}
              </div>
              <div className="text-xs text-muted-foreground">Absent</div>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats.leaveDays}
              </div>
              <div className="text-xs text-muted-foreground">Leave</div>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-md">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {stats.holidays + stats.weekends}
              </div>
              <div className="text-xs text-muted-foreground">Holidays</div>
            </div>
          </div>
        )}

        {/* Hours Summary */}
        {stats && (
          <div className="flex items-center justify-center gap-6 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{formatHours(stats.totalWorkingHours)}</span>
                <span className="text-muted-foreground"> worked</span>
              </span>
            </div>
            {stats.totalOvertimeHours > 0 && (
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-orange-500" />
                <span className="text-sm">
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {formatHours(stats.totalOvertimeHours)}
                  </span>
                  <span className="text-muted-foreground"> overtime</span>
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
