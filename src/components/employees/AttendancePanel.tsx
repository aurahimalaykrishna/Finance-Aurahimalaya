import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAttendance } from '@/hooks/useAttendance';
import { Clock, LogIn, LogOut, Timer, Loader2 } from 'lucide-react';

interface AttendancePanelProps {
  employeeId: string;
  employeeName: string;
  showNotes?: boolean;
}

export function AttendancePanel({ employeeId, employeeName, showNotes = true }: AttendancePanelProps) {
  const { todayAttendance, isLoading, checkIn, checkOut } = useAttendance(employeeId);
  const [notes, setNotes] = useState('');

  const handleCheckIn = () => {
    checkIn.mutate({ employeeId, notes: notes.trim() || undefined });
    setNotes('');
  };

  const handleCheckOut = () => {
    if (todayAttendance) {
      checkOut.mutate({ attendanceId: todayAttendance.id, notes: notes.trim() || undefined });
      setNotes('');
    }
  };

  const getStatusBadge = () => {
    if (!todayAttendance) {
      return <Badge variant="secondary">Not Checked In</Badge>;
    }
    
    switch (todayAttendance.status) {
      case 'present':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Present</Badge>;
      case 'half_day':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Half Day</Badge>;
      case 'leave':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400">On Leave</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'holiday':
        return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400">Holiday</Badge>;
      default:
        return <Badge variant="secondary">{todayAttendance.status}</Badge>;
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--';
    return format(new Date(timestamp), 'hh:mm a');
  };

  const formatHours = (hours: number) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isOnLeave = todayAttendance?.status === 'leave' || todayAttendance?.status === 'holiday';
  const hasCheckedIn = !!todayAttendance?.check_in;
  const hasCheckedOut = !!todayAttendance?.check_out;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Attendance
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {getStatusBadge()}
        </div>

        {!isOnLeave && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <LogIn className="h-3 w-3" />
                  Check-in
                </div>
                <div className="font-medium">{formatTime(todayAttendance?.check_in ?? null)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <LogOut className="h-3 w-3" />
                  Check-out
                </div>
                <div className="font-medium">{formatTime(todayAttendance?.check_out ?? null)}</div>
              </div>
            </div>

            {hasCheckedOut && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    Working Hours
                  </div>
                  <div className="font-medium">{formatHours(todayAttendance?.working_hours || 0)}</div>
                </div>
                {(todayAttendance?.overtime_hours || 0) > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Overtime</div>
                    <div className="font-medium text-orange-600 dark:text-orange-400">
                      {formatHours(todayAttendance?.overtime_hours || 0)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showNotes && !hasCheckedOut && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Notes (optional)</label>
                <Textarea
                  placeholder="Add a note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCheckIn}
                disabled={hasCheckedIn || checkIn.isPending}
                className="flex-1"
              >
                {checkIn.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                Check In
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={!hasCheckedIn || hasCheckedOut || checkOut.isPending}
                variant="outline"
                className="flex-1"
              >
                {checkOut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Check Out
              </Button>
            </div>
          </>
        )}

        {isOnLeave && (
          <div className="text-center py-4 text-muted-foreground">
            {todayAttendance.status === 'leave' 
              ? 'You are on approved leave today'
              : 'Today is a holiday'}
          </div>
        )}

        {todayAttendance?.notes && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">Notes</div>
            <div className="text-sm mt-1">{todayAttendance.notes}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
