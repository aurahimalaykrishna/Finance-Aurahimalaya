import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployeeLeaves } from '@/hooks/useEmployeeLeaves';
import { MyEmployee } from '@/hooks/useMyEmployee';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: MyEmployee;
  availableLeave: ReturnType<ReturnType<typeof useEmployeeLeaves>['calculateAvailableLeave']>;
}

type LeaveType = 'home' | 'sick' | 'maternity' | 'paternity' | 'mourning';

export function LeaveRequestDialog({
  open,
  onOpenChange,
  employee,
  availableLeave,
}: LeaveRequestDialogProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>('home');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');

  const { createLeaveRequest } = useEmployeeLeaves(employee.id);

  const leaveTypes: { value: LeaveType; label: string; available: number }[] = [
    { value: 'home', label: 'Home Leave', available: availableLeave?.homeLeave.available || 0 },
    { value: 'sick', label: 'Sick Leave', available: availableLeave?.sickLeave.available || 0 },
    ...(employee.gender === 'female' ? [
      { value: 'maternity' as LeaveType, label: 'Maternity Leave', available: availableLeave?.maternityLeave.available || 0 },
    ] : []),
    ...(employee.gender === 'male' ? [
      { value: 'paternity' as LeaveType, label: 'Paternity Leave', available: availableLeave?.paternityLeave.available || 0 },
    ] : []),
    { value: 'mourning', label: 'Mourning Leave', available: availableLeave?.mourningLeave.available || 0 },
  ];

  const daysRequested = startDate && endDate 
    ? differenceInDays(endDate, startDate) + 1 
    : 0;

  const selectedLeaveType = leaveTypes.find(t => t.value === leaveType);
  const hasInsufficientBalance = selectedLeaveType && daysRequested > selectedLeaveType.available;

  const handleSubmit = () => {
    if (!startDate || !endDate || hasInsufficientBalance) return;

    createLeaveRequest.mutate({
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      reason: reason.trim() || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setLeaveType('home');
        setStartDate(undefined);
        setEndDate(undefined);
        setReason('');
      },
    });
  };

  const isValid = startDate && endDate && daysRequested > 0 && !hasInsufficientBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>
            Submit a leave request for approval. Your manager will review it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} ({type.available} days available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (date && (!endDate || date > endDate)) {
                        setEndDate(date);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days Summary */}
          {daysRequested > 0 && (
            <div className={cn(
              'p-3 rounded-lg text-sm',
              hasInsufficientBalance 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-muted'
            )}>
              <strong>{daysRequested} day{daysRequested > 1 ? 's' : ''}</strong> requested
              {hasInsufficientBalance && (
                <span className="ml-2">
                  (Exceeds available balance of {selectedLeaveType?.available} days)
                </span>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Enter reason for leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || createLeaveRequest.isPending}
          >
            {createLeaveRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
