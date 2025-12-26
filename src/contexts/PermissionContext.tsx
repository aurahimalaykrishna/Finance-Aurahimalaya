import React, { createContext, useContext, useMemo } from 'react';
import { useUserRoles, AppRole, Permission } from '@/hooks/useUserRoles';

interface PermissionContextType {
  userRole: AppRole | null | undefined;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  canManageUsers: boolean;
  canEditData: boolean;
  canDeleteData: boolean;
  canViewData: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const {
    userRole,
    isLoading,
    hasPermission,
    canManageUsers,
    canEditData,
    canDeleteData,
    canViewData,
  } = useUserRoles();

  const value = useMemo(() => ({
    userRole,
    isLoading,
    hasPermission,
    canManageUsers,
    canEditData,
    canDeleteData,
    canViewData,
  }), [userRole, isLoading, hasPermission, canManageUsers, canEditData, canDeleteData, canViewData]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
