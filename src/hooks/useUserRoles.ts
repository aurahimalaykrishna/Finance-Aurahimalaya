import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'owner' | 'admin' | 'accountant' | 'viewer' | 'employee';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  created_at: string;
}

export interface TeamMember {
  user_id: string;
  email: string;
  role: AppRole;
  granted_by: string | null;
  created_at: string;
}

const PERMISSIONS = {
  owner: ['manage_users', 'manage_settings', 'manage_companies', 'edit_data', 'view_data', 'delete_data', 'view_own_data', 'apply_leave'],
  admin: ['manage_settings', 'manage_companies', 'edit_data', 'view_data', 'delete_data', 'view_own_data', 'apply_leave'],
  accountant: ['edit_data', 'view_data', 'view_own_data', 'apply_leave'],
  viewer: ['view_data', 'view_own_data'],
  employee: ['view_own_data', 'apply_leave'],
} as const;

export type Permission = typeof PERMISSIONS[AppRole][number];

export function useUserRoles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: user!.id });
      
      if (error) throw error;
      return data as AppRole | null;
    },
    enabled: !!user,
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_team_members', { _owner_id: user!.id });
      
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user && (userRole === 'owner' || userRole === 'admin'),
  });

  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    return PERMISSIONS[userRole].includes(permission as never);
  };

  const canManageUsers = userRole === 'owner';
  const canEditData = hasPermission('edit_data');
  const canDeleteData = hasPermission('delete_data');
  const canViewData = hasPermission('view_data');

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;

      // Then insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          granted_by: user!.id,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Role updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' });
    },
  });

  const removeTeamMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Team member removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing team member', description: error.message, variant: 'destructive' });
    },
  });

  return {
    userRole,
    teamMembers,
    isLoading: roleLoading || teamLoading,
    hasPermission,
    canManageUsers,
    canEditData,
    canDeleteData,
    canViewData,
    updateUserRole,
    removeTeamMember,
  };
}
