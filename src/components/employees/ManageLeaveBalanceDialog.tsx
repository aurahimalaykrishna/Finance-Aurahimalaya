import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEmployeeLeaves, LeaveBalance } from '@/hooks/useEmployeeLeaves';
import { Loader2, Calendar, Settings } from 'lucide-react';
import {
  HOME_LEAVE_MAX_ACCRUAL,
  SICK_LEAVE_MAX_ACCRUAL,
  MATERNITY_PAID_DAYS,
  PATERNITY_LEAVE_DAYS,
  MOURNING_LEAVE_DAYS,
  getPublicHolidayEntitlement,
} from '@/lib/nepal-hr-calculations';

interface ManageLeaveBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  gender: string;
  fiscalYear: string;
  leaveBalance: LeaveBalance | null;
}

export function ManageLeaveBalanceDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  gender,
  fiscalYear,
  leaveBalance,
}: ManageLeaveBalanceDialogProps) {
  const { updateLeaveBalance } = useEmployeeLeaves(employeeId);

  // Form state
  const [formData, setFormData] = useState({
    home_leave_accrued: 0,
    home_leave_used: 0,
    home_leave_carried_forward: 0,
    sick_leave_accrued: 0,
    sick_leave_used: 0,
    sick_leave_carried_forward: 0,
    maternity_leave_used: 0,
    paternity_leave_used: 0,
    mourning_leave_used: 0,
    public_holidays_used: 0,
  });

  // Populate form when dialog opens
  useEffect(() => {
    if (open && leaveBalance) {
      setFormData({
        home_leave_accrued: leaveBalance.home_leave_accrued || 0,
        home_leave_used: leaveBalance.home_leave_used || 0,
        home_leave_carried_forward: leaveBalance.home_leave_carried_forward || 0,
        sick_leave_accrued: leaveBalance.sick_leave_accrued || 0,
        sick_leave_used: leaveBalance.sick_leave_used || 0,
        sick_leave_carried_forward: leaveBalance.sick_leave_carried_forward || 0,
        maternity_leave_used: leaveBalance.maternity_leave_used || 0,
        paternity_leave_used: leaveBalance.paternity_leave_used || 0,
        mourning_leave_used: leaveBalance.mourning_leave_used || 0,
        public_holidays_used: leaveBalance.public_holidays_used || 0,
      });
    }
  }, [open, leaveBalance]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSubmit = () => {
    if (!leaveBalance?.id) return;

    updateLeaveBalance.mutate({
      balanceId: leaveBalance.id,
      data: formData,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Leave Balance
          </DialogTitle>
          <DialogDescription>
            Adjust leave balances for <strong>{employeeName}</strong> — FY {fiscalYear}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Home Leave */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Home Leave
                <span className="text-xs text-muted-foreground ml-auto">Max: {HOME_LEAVE_MAX_ACCRUAL} days</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Accrued</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max={HOME_LEAVE_MAX_ACCRUAL}
                  value={formData.home_leave_accrued}
                  onChange={(e) => handleChange('home_leave_accrued', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Carried Forward</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.home_leave_carried_forward}
                  onChange={(e) => handleChange('home_leave_carried_forward', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Used</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.home_leave_used}
                  onChange={(e) => handleChange('home_leave_used', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sick Leave */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                Sick Leave
                <span className="text-xs text-muted-foreground ml-auto">Max: {SICK_LEAVE_MAX_ACCRUAL} days</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Accrued</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max={SICK_LEAVE_MAX_ACCRUAL}
                  value={formData.sick_leave_accrued}
                  onChange={(e) => handleChange('sick_leave_accrued', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Carried Forward</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.sick_leave_carried_forward}
                  onChange={(e) => handleChange('sick_leave_carried_forward', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Used</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.sick_leave_used}
                  onChange={(e) => handleChange('sick_leave_used', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Gender-specific leaves */}
          <div className="grid grid-cols-2 gap-4">
            {gender === 'female' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-pink-500" />
                    Maternity Leave
                    <span className="text-xs text-muted-foreground ml-auto">Max: {MATERNITY_PAID_DAYS} days</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs">Used</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max={MATERNITY_PAID_DAYS}
                      value={formData.maternity_leave_used}
                      onChange={(e) => handleChange('maternity_leave_used', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {gender === 'male' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Paternity Leave
                    <span className="text-xs text-muted-foreground ml-auto">Max: {PATERNITY_LEAVE_DAYS} days</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs">Used</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max={PATERNITY_LEAVE_DAYS}
                      value={formData.paternity_leave_used}
                      onChange={(e) => handleChange('paternity_leave_used', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Mourning Leave
                  <span className="text-xs text-muted-foreground ml-auto">Max: {MOURNING_LEAVE_DAYS} days</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-xs">Used</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max={MOURNING_LEAVE_DAYS}
                    value={formData.mourning_leave_used}
                    onChange={(e) => handleChange('mourning_leave_used', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Public Holidays
                  <span className="text-xs text-muted-foreground ml-auto">Max: {getPublicHolidayEntitlement(gender)} days</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-xs">Used</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max={getPublicHolidayEntitlement(gender)}
                    value={formData.public_holidays_used}
                    onChange={(e) => handleChange('public_holidays_used', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateLeaveBalance.isPending || !leaveBalance?.id}
          >
            {updateLeaveBalance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
