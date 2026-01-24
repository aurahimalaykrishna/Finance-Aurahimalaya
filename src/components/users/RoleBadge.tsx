import { Badge } from '@/components/ui/badge';
import type { AppRole } from '@/hooks/useUserRoles';
import { Crown, Shield, Calculator, Eye, UserCircle } from 'lucide-react';

interface RoleBadgeProps {
  role: AppRole;
  size?: 'sm' | 'default';
}

const roleConfig: Record<AppRole, { label: string; icon: React.ComponentType<{ className?: string }>; variant: 'default' | 'secondary' | 'outline' }> = {
  owner: { label: 'Owner', icon: Crown, variant: 'default' },
  admin: { label: 'Admin', icon: Shield, variant: 'secondary' },
  accountant: { label: 'Accountant', icon: Calculator, variant: 'outline' },
  viewer: { label: 'Viewer', icon: Eye, variant: 'outline' },
  employee: { label: 'Employee', icon: UserCircle, variant: 'outline' },
};

export function RoleBadge({ role, size = 'default' }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={size === 'sm' ? 'text-xs px-2 py-0.5' : ''}>
      <Icon className={size === 'sm' ? 'w-3 h-3 mr-1' : 'w-3.5 h-3.5 mr-1.5'} />
      {config.label}
    </Badge>
  );
}
