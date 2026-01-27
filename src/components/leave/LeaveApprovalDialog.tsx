import { useState } from 'react';
import { format } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { LeaveRequestWithEmployee } from '@/hooks/useAllLeaveRequests';

interface LeaveApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LeaveRequestWithEmployee | null;
  action: 'approve' | 'reject';
  onConfirm: (comment?: string) => Promise<void>;
  isLoading?: boolean;
}

const leaveTypeLabels: Record<string, string> = {
  home: 'Home Leave',
  sick: 'Sick Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  mourning: 'Mourning Leave',
  public_holiday: 'Public Holiday',
};

export function LeaveApprovalDialog({
  open,
  onOpenChange,
  request,
  action,
  onConfirm,
  isLoading,
}: LeaveApprovalDialogProps) {
  const [comment, setComment] = useState('');

  const handleConfirm = async () => {
    await onConfirm(comment.trim() || undefined);
    setComment('');
    onOpenChange(false);
  };

  if (!request) return null;

  const isApprove = action === 'approve';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Approve Leave Request
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Reject Leave Request
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? 'Confirm approval of this leave request.'
              : 'Confirm rejection of this leave request.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Employee</span>
              <span className="font-medium">{request.employee.full_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Leave Type</span>
              <Badge variant="outline">
                {leaveTypeLabels[request.leave_type] || request.leave_type}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="font-medium">
                {format(new Date(request.start_date), 'MMM d')} -{' '}
                {format(new Date(request.end_date), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Days</span>
              <span className="font-medium">{request.days_requested} day(s)</span>
            </div>
            {request.reason && (
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">Reason</span>
                <p className="mt-1 text-sm">{request.reason}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isApprove
                  ? 'Add a note for the employee...'
                  : 'Explain why this request is being rejected...'
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={isApprove ? 'default' : 'destructive'}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isApprove ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
