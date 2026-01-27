import React, { createContext, useContext, useMemo, useCallback } from 'react';
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
  canViewOwnData: boolean;
  canApplyLeave: boolean;
  canManageEmployees: boolean;
  canManagePayroll: boolean;
  canApproveLeave: boolean;
  canViewTeamData: boolean;
  currentCompanyRole: AppRole | null;
}

const PERMISSIONS = {
  owner: ['manage_users', 'manage_settings', 'manage_companies', 'manage_employees', 'manage_payroll', 'approve_leave', 'edit_data', 'view_data', 'view_team_data', 'delete_data', 'view_own_data', 'apply_leave'],
  admin: ['manage_settings', 'manage_companies', 'manage_employees', 'manage_payroll', 'approve_leave', 'edit_data', 'view_data', 'view_team_data', 'delete_data', 'view_own_data', 'apply_leave'],
  hr_manager: ['manage_employees', 'manage_payroll', 'approve_leave', 'edit_data', 'view_data', 'view_team_data', 'view_own_data', 'apply_leave'],
  manager: ['approve_leave', 'view_data', 'view_team_data', 'view_own_data', 'apply_leave'],
  supervisor: ['approve_leave', 'view_team_data', 'view_own_data', 'apply_leave'],
  accountant: ['edit_data', 'view_data', 'view_own_data', 'apply_leave'],
  viewer: ['view_data', 'view_own_data'],
  employee: ['view_own_data', 'apply_leave'],
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

  // Check permission for a specific company - memoized with useCallback
  const hasPermissionForCompany = useCallback((permission: Permission, companyId?: string): boolean => {
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
  }, [userRole, selectedCompany?.id, isAllCompanies, hasPermission, companyAccess]);

  const canViewOwnData = hasPermission('view_own_data');
  const canApplyLeavePermission = hasPermission('apply_leave');
  const canManageEmployees = hasPermission('manage_employees');
  const canManagePayroll = hasPermission('manage_payroll');
  const canApproveLeave = hasPermission('approve_leave');
  const canViewTeamData = hasPermission('view_team_data');

  const value = useMemo(() => ({
    userRole,
    isLoading: isLoading || accessLoading,
    hasPermission,
    hasPermissionForCompany,
    canManageUsers,
    canEditData,
    canDeleteData,
    canViewData,
    canViewOwnData,
    canApplyLeave: canApplyLeavePermission,
    canManageEmployees,
    canManagePayroll,
    canApproveLeave,
    canViewTeamData,
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
    canViewOwnData,
    canApplyLeavePermission,
    canManageEmployees,
    canManagePayroll,
    canApproveLeave,
    canViewTeamData,
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
