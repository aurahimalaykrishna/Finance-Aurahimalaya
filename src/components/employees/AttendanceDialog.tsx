import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAttendance, AttendanceLog } from '@/hooks/useAttendance';
import { Loader2 } from 'lucide-react';

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  date: Date;
  existingRecord?: AttendanceLog;
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'weekend', label: 'Weekend' },
];

export function AttendanceDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  date,
  existingRecord,
}: AttendanceDialogProps) {
  const { createOrUpdateAttendance, deleteAttendance } = useAttendance(employeeId);
  
  const [status, setStatus] = useState<string>('present');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingRecord) {
      setStatus(existingRecord.status);
      setCheckIn(existingRecord.check_in ? format(new Date(existingRecord.check_in), "HH:mm") : '');
      setCheckOut(existingRecord.check_out ? format(new Date(existingRecord.check_out), "HH:mm") : '');
      setNotes(existingRecord.notes || '');
    } else {
      setStatus('present');
      setCheckIn('');
      setCheckOut('');
      setNotes('');
    }
  }, [existingRecord, open]);

  const handleSave = () => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    let checkInTimestamp: string | undefined;
    let checkOutTimestamp: string | undefined;

    if (checkIn) {
      const [hours, minutes] = checkIn.split(':');
      const checkInDate = new Date(date);
      checkInDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      checkInTimestamp = checkInDate.toISOString();
    }

    if (checkOut) {
      const [hours, minutes] = checkOut.split(':');
      const checkOutDate = new Date(date);
      checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      checkOutTimestamp = checkOutDate.toISOString();
    }

    createOrUpdateAttendance.mutate(
      {
        employee_id: employeeId,
        date: dateStr,
        status: status as AttendanceLog['status'],
        check_in: checkInTimestamp,
        check_out: checkOutTimestamp,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const handleDelete = () => {
    if (existingRecord) {
      deleteAttendance.mutate(existingRecord.id, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isSubmitting = createOrUpdateAttendance.isPending || deleteAttendance.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRecord ? 'Edit Attendance' : 'Add Attendance'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Employee</span>
            <span className="font-medium">{employeeName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{format(date, 'MMMM d, yyyy')}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(status === 'present' || status === 'half_day') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check-in">Check-in Time</Label>
                <Input
                  id="check-in"
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check-out">Check-out Time</Label>
                <Input
                  id="check-out"
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingRecord && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
