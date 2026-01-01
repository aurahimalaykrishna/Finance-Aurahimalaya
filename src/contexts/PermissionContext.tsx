import React, { createContext, useContext, useMemo } from 'react';
import { useUserRoles, AppRole, Permission } from '@/hooks/useUserRoles';
import { useCompanyAccess } from '@/hooks/useCompanyAccess';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface PermissionContextType {
  userRole: AppRole | null | undefined;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasPermissionForCompany: (permission: Permission, companyId?: string) => boolean;
  canManageUsers: boolean;
  canEditData: boolean;
  canDeleteData: boolean;
  canViewData: boolean;
  currentCompanyRole: AppRole | null;
}

const PERMISSIONS = {
  owner: ['manage_users', 'manage_settings', 'manage_companies', 'edit_data', 'view_data', 'delete_data'],
  admin: ['manage_settings', 'manage_companies', 'edit_data', 'view_data', 'delete_data'],
  accountant: ['edit_data', 'view_data'],
  viewer: ['view_data'],
} as const;

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

  const { companyAccess, isLoading: accessLoading } = useCompanyAccess();
  const { selectedCompany, isAllCompanies } = useCompanyContext();

  // Get the role for the currently selected company
  const currentCompanyRole = useMemo(() => {
    if (isAllCompanies || !selectedCompany) {
      return userRole || null;
    }

    const companySpecificAccess = companyAccess.find(
      ca => ca.company_id === selectedCompany.id
    );

    return companySpecificAccess?.role || userRole || null;
  }, [selectedCompany, isAllCompanies, companyAccess, userRole]);

  // Check permission for a specific company
  const hasPermissionForCompany = (permission: Permission, companyId?: string): boolean => {
    // Owner always has all permissions
    if (userRole === 'owner') return true;

    const targetCompanyId = companyId || selectedCompany?.id;
    
    if (!targetCompanyId || isAllCompanies) {
      // Fall back to global role
      return hasPermission(permission);
    }

    // Check company-specific role
    const companySpecificAccess = companyAccess.find(
      ca => ca.company_id === targetCompanyId
    );

    const effectiveRole = companySpecificAccess?.role || userRole;
    if (!effectiveRole) return false;

    return PERMISSIONS[effectiveRole].includes(permission as never);
  };

  const value = useMemo(() => ({
    userRole,
    isLoading: isLoading || accessLoading,
    hasPermission,
    hasPermissionForCompany,
    canManageUsers,
    canEditData,
    canDeleteData,
    canViewData,
    currentCompanyRole,
  }), [
    userRole, 
    isLoading, 
    accessLoading,
    hasPermission, 
    hasPermissionForCompany,
    canManageUsers, 
    canEditData, 
    canDeleteData, 
    canViewData,
    currentCompanyRole,
  ]);

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
