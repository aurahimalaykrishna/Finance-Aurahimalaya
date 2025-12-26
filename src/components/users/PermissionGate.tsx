import React from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import type { Permission, AppRole } from '@/hooks/useUserRoles';

interface PermissionGateProps {
  children: React.ReactNode;
  requires?: Permission[];
  roles?: AppRole[];
  fallback?: React.ReactNode;
}

export function PermissionGate({ children, requires = [], roles = [], fallback = null }: PermissionGateProps) {
  const { userRole, hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  // Check role-based access
  if (roles.length > 0 && userRole && !roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // Check permission-based access
  if (requires.length > 0) {
    const hasAllPermissions = requires.every(permission => hasPermission(permission));
    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
