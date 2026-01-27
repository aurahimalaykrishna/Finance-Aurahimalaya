import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanyLeaveType {
  id: string;
  company_id: string;
  code: string;
  name: string;
  annual_entitlement: number;
  max_accrual: number | null;
  max_carry_forward: number;
  accrual_type: 'annual' | 'monthly' | 'per_working_days';
  accrual_rate: number | null;
  accrual_per_days: number | null;
  gender_restriction: 'male' | 'female' | null;
  is_paid: boolean;
  requires_approval: boolean;
  is_active: boolean;
  color: string;
  icon: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type LeaveTypeInsert = Omit<CompanyLeaveType, 'id' | 'created_at' | 'updated_at'>;
export type LeaveTypeUpdate = Partial<LeaveTypeInsert>;

const DEFAULT_LEAVE_TYPES: Omit<LeaveTypeInsert, 'company_id'>[] = [
  {
    code: 'home',
    name: 'Home Leave',
    annual_entitlement: 18,
    max_accrual: 90,
    max_carry_forward: 90,
    accrual_type: 'per_working_days',
    accrual_rate: 1,
    accrual_per_days: 20,
    gender_restriction: null,
    is_paid: true,
    requires_approval: true,
    is_active: true,
    color: '#3b82f6',
    icon: 'home',
    display_order: 0,
  },
  {
    code: 'sick',
    name: 'Sick Leave',
    annual_entitlement: 12,
    max_accrual: 45,
    max_carry_forward: 45,
    accrual_type: 'monthly',
    accrual_rate: 1,
    accrual_per_days: null,
    gender_restriction: null,
    is_paid: true,
    requires_approval: true,
    is_active: true,
    color: '#ef4444',
    icon: 'heart-pulse',
    display_order: 1,
  },
  {
    code: 'maternity',
    name: 'Maternity Leave',
    annual_entitlement: 60,
    max_accrual: null,
    max_carry_forward: 0,
    accrual_type: 'annual',
    accrual_rate: null,
    accrual_per_days: null,
    gender_restriction: 'female',
    is_paid: true,
    requires_approval: true,
    is_active: true,
    color: '#ec4899',
    icon: 'baby',
    display_order: 2,
  },
  {
    code: 'paternity',
    name: 'Paternity Leave',
    annual_entitlement: 15,
    max_accrual: null,
    max_carry_forward: 0,
    accrual_type: 'annual',
    accrual_rate: null,
    accrual_per_days: null,
    gender_restriction: 'male',
    is_paid: true,
    requires_approval: true,
    is_active: true,
    color: '#8b5cf6',
    icon: 'baby',
    display_order: 3,
  },
  {
    code: 'mourning',
    name: 'Mourning Leave',
    annual_entitlement: 13,
    max_accrual: null,
    max_carry_forward: 0,
    accrual_type: 'annual',
    accrual_rate: null,
    accrual_per_days: null,
    gender_restriction: null,
    is_paid: true,
    requires_approval: true,
    is_active: true,
    color: '#6b7280',
    icon: 'heart',
    display_order: 4,
  },
];

export function useCompanyLeaveTypes(companyId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: leaveTypes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['company-leave-types', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_leave_types')
        .select('*')
        .eq('company_id', companyId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as CompanyLeaveType[];
    },
    enabled: !!companyId,
  });

  const createLeaveType = useMutation({
    mutationFn: async (leaveType: LeaveTypeInsert) => {
      const { data, error } = await supabase
        .from('company_leave_types')
        .insert(leaveType)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-leave-types', companyId] });
      toast({ title: 'Leave type created successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create leave type',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateLeaveType = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeaveTypeUpdate }) => {
      const { data: result, error } = await supabase
        .from('company_leave_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-leave-types', companyId] });
      toast({ title: 'Leave type updated successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update leave type',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteLeaveType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_leave_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-leave-types', companyId] });
      toast({ title: 'Leave type deleted successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete leave type',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const initializeDefaults = useMutation({
    mutationFn: async (targetCompanyId: string) => {
      const leaveTypesToInsert = DEFAULT_LEAVE_TYPES.map((lt) => ({
        ...lt,
        company_id: targetCompanyId,
      }));

      const { data, error } = await supabase
        .from('company_leave_types')
        .insert(leaveTypesToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-leave-types', companyId] });
      toast({ title: 'Default leave types initialized successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to initialize defaults',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const reorderLeaveTypes = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('company_leave_types')
          .update({ display_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-leave-types', companyId] });
    },
  });

  // Filter active leave types for employee use
  const activeLeaveTypes = leaveTypes.filter((lt) => lt.is_active);

  // Get leave types applicable to a specific gender
  const getLeaveTypesForGender = (gender: string) => {
    return activeLeaveTypes.filter(
      (lt) => !lt.gender_restriction || lt.gender_restriction === gender
    );
  };

  return {
    leaveTypes,
    activeLeaveTypes,
    isLoading,
    error,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    initializeDefaults,
    reorderLeaveTypes,
    getLeaveTypesForGender,
  };
}
