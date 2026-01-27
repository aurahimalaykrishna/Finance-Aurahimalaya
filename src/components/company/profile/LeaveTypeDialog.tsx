import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { CompanyLeaveType, LeaveTypeInsert } from '@/hooks/useCompanyLeaveTypes';

const leaveTypeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).regex(/^[a-z_]+$/, 'Use lowercase letters and underscores only'),
  name: z.string().min(1, 'Name is required').max(100),
  annual_entitlement: z.coerce.number().min(0, 'Must be 0 or greater'),
  max_accrual: z.coerce.number().nullable(),
  max_carry_forward: z.coerce.number().min(0).default(0),
  accrual_type: z.enum(['annual', 'monthly', 'per_working_days']),
  accrual_rate: z.coerce.number().nullable(),
  accrual_per_days: z.coerce.number().int().nullable(),
  gender_restriction: z.enum(['male', 'female']).nullable(),
  is_paid: z.boolean().default(true),
  requires_approval: z.boolean().default(true),
  is_active: z.boolean().default(true),
  color: z.string().default('#6366f1'),
});

type LeaveTypeFormData = z.infer<typeof leaveTypeSchema>;

interface LeaveTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  leaveType?: CompanyLeaveType | null;
  onSave: (data: LeaveTypeInsert) => void;
  isPending: boolean;
}

export function LeaveTypeDialog({
  open,
  onOpenChange,
  companyId,
  leaveType,
  onSave,
  isPending,
}: LeaveTypeDialogProps) {
  const isEditing = !!leaveType;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeaveTypeFormData>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: leaveType
      ? {
          code: leaveType.code,
          name: leaveType.name,
          annual_entitlement: leaveType.annual_entitlement,
          max_accrual: leaveType.max_accrual,
          max_carry_forward: leaveType.max_carry_forward,
          accrual_type: leaveType.accrual_type,
          accrual_rate: leaveType.accrual_rate,
          accrual_per_days: leaveType.accrual_per_days,
          gender_restriction: leaveType.gender_restriction,
          is_paid: leaveType.is_paid,
          requires_approval: leaveType.requires_approval,
          is_active: leaveType.is_active,
          color: leaveType.color,
        }
      : {
          code: '',
          name: '',
          annual_entitlement: 0,
          max_accrual: null,
          max_carry_forward: 0,
          accrual_type: 'annual',
          accrual_rate: null,
          accrual_per_days: null,
          gender_restriction: null,
          is_paid: true,
          requires_approval: true,
          is_active: true,
          color: '#6366f1',
        },
  });

  const accrualType = watch('accrual_type');
  const isPaid = watch('is_paid');
  const requiresApproval = watch('requires_approval');
  const isActive = watch('is_active');

  const onSubmit = (data: LeaveTypeFormData) => {
    const submitData: LeaveTypeInsert = {
      company_id: companyId,
      code: data.code,
      name: data.name,
      annual_entitlement: data.annual_entitlement,
      max_accrual: data.max_accrual || null,
      max_carry_forward: data.max_carry_forward,
      accrual_type: data.accrual_type,
      accrual_rate: data.accrual_type === 'per_working_days' ? data.accrual_rate : null,
      accrual_per_days: data.accrual_type === 'per_working_days' ? data.accrual_per_days : null,
      gender_restriction: data.gender_restriction || null,
      is_paid: data.is_paid,
      requires_approval: data.requires_approval,
      is_active: data.is_active,
      color: data.color,
      icon: 'calendar',
      display_order: leaveType?.display_order ?? 999,
    };
    onSave(submitData);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
          <DialogDescription>
            Configure leave type settings for your company.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="casual_leave"
                {...register('code')}
                disabled={isEditing}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Casual Leave" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Entitlement */}
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium">Entitlement</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annual_entitlement">Annual Days *</Label>
                <Input
                  id="annual_entitlement"
                  type="number"
                  step="0.5"
                  {...register('annual_entitlement')}
                />
                {errors.annual_entitlement && (
                  <p className="text-sm text-destructive">
                    {errors.annual_entitlement.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_accrual">Max Accrual</Label>
                <Input
                  id="max_accrual"
                  type="number"
                  step="0.5"
                  placeholder="Unlimited"
                  {...register('max_accrual')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_carry_forward">Carry Forward</Label>
                <Input
                  id="max_carry_forward"
                  type="number"
                  step="0.5"
                  {...register('max_carry_forward')}
                />
              </div>
            </div>
          </div>

          {/* Accrual Type */}
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium">Accrual Type</h4>
            <RadioGroup
              value={accrualType}
              onValueChange={(v) => setValue('accrual_type', v as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="annual" id="annual" />
                <Label htmlFor="annual" className="font-normal">
                  Annual - All days available at year start
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal">
                  Monthly - Proportional accrual each month
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="per_working_days" id="per_working_days" />
                <Label htmlFor="per_working_days" className="font-normal">
                  Per Working Days
                </Label>
              </div>
            </RadioGroup>

            {accrualType === 'per_working_days' && (
              <div className="flex items-center gap-2 ml-6">
                <span className="text-sm text-muted-foreground">Earn</span>
                <Input
                  type="number"
                  step="0.5"
                  className="w-20"
                  {...register('accrual_rate')}
                />
                <span className="text-sm text-muted-foreground">day(s) per</span>
                <Input
                  type="number"
                  className="w-20"
                  {...register('accrual_per_days')}
                />
                <span className="text-sm text-muted-foreground">working days</span>
              </div>
            )}
          </div>

          {/* Restrictions */}
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium">Restrictions</h4>
            <div className="space-y-2">
              <Label>Gender Restriction</Label>
              <Select
                value={watch('gender_restriction') || 'all'}
                onValueChange={(v) =>
                  setValue('gender_restriction', v === 'all' ? null : (v as any))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="male">Male Only</SelectItem>
                  <SelectItem value="female">Female Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium">Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_paid">Paid Leave</Label>
                <Switch
                  id="is_paid"
                  checked={isPaid}
                  onCheckedChange={(v) => setValue('is_paid', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requires_approval">Requires Approval</Label>
                <Switch
                  id="requires_approval"
                  checked={requiresApproval}
                  onCheckedChange={(v) => setValue('requires_approval', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(v) => setValue('is_active', v)}
                />
              </div>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                className="w-16 h-10 p-1"
                {...register('color')}
              />
              <Input {...register('color')} className="flex-1" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'} Leave Type
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
