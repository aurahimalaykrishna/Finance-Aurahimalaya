import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { CompanyLeaveType } from '@/hooks/useCompanyLeaveTypes';

interface LeaveTypeCardProps {
  leaveType: CompanyLeaveType;
  onEdit: (leaveType: CompanyLeaveType) => void;
  onDelete: (leaveType: CompanyLeaveType) => void;
}

export function LeaveTypeCard({ leaveType, onEdit, onDelete }: LeaveTypeCardProps) {
  const getAccrualDescription = () => {
    switch (leaveType.accrual_type) {
      case 'annual':
        return 'Annual';
      case 'monthly':
        return 'Monthly';
      case 'per_working_days':
        return `${leaveType.accrual_rate} per ${leaveType.accrual_per_days} days`;
      default:
        return leaveType.accrual_type;
    }
  };

  return (
    <Card className={!leaveType.is_active ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div className="cursor-grab text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Color Indicator */}
          <div
            className="w-3 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: leaveType.color }}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{leaveType.name}</h4>
              {!leaveType.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              {leaveType.gender_restriction && (
                <Badge variant="outline" className="text-xs capitalize">
                  {leaveType.gender_restriction}
                </Badge>
              )}
              {!leaveType.is_paid && (
                <Badge variant="outline" className="text-xs">
                  Unpaid
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Code: {leaveType.code}
            </p>
          </div>

          {/* Entitlement Info */}
          <div className="hidden sm:flex flex-col items-end text-sm">
            <span className="font-medium">
              {leaveType.annual_entitlement} days/year
            </span>
            <span className="text-muted-foreground">
              {leaveType.max_accrual ? `Max: ${leaveType.max_accrual}` : 'No limit'}
            </span>
          </div>

          {/* Accrual Type */}
          <div className="hidden md:block text-sm text-muted-foreground w-32">
            {getAccrualDescription()}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(leaveType)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(leaveType)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
