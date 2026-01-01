import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/hooks/useUserRoles';

export interface CompanyAccess {
  company_id: string;
  company_name: string;
  role: AppRole;
  granted_by: string | null;
  created_at: string;
}

export interface CompanyUser {
  user_id: string;
  email: string;
  role: AppRole;
  granted_by: string | null;
  created_at: string;
}

export function useCompanyAccess(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const targetUserId = userId || user?.id;

  // Fetch company access for a specific user
  const { data: companyAccess = [], isLoading } = useQuery({
    queryKey: ['company-access', targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_company_access', { _user_id: targetUserId! });
      
      if (error) throw error;
      return data as CompanyAccess[];
    },
    enabled: !!targetUserId,
  });

  // Grant company access
  const grantAccess = useMutation({
    mutationFn: async ({ 
      userId, 
      companyId, 
      role 
    }: { 
      userId: string; 
      companyId: string; 
      role: AppRole;
    }) => {
      const { error } = await supabase
        .from('company_access')
        .insert({
          user_id: userId,
          company_id: companyId,
          role,
          granted_by: user!.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-access'] });
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast({ title: 'Company access granted' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error granting access', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Update company role
  const updateAccess = useMutation({
    mutationFn: async ({ 
      userId, 
      companyId, 
      role 
    }: { 
      userId: string; 
      companyId: string; 
      role: AppRole;
    }) => {
      const { error } = await supabase
        .from('company_access')
        .update({ role })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-access'] });
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast({ title: 'Company role updated' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error updating role', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  // Revoke company access
  const revokeAccess = useMutation({
    mutationFn: async ({ 
      userId, 
      companyId 
    }: { 
      userId: string; 
      companyId: string;
    }) => {
      const { error } = await supabase
        .from('company_access')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-access'] });
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast({ title: 'Company access revoked' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error revoking access', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  return {
    companyAccess,
    isLoading,
    grantAccess,
    updateAccess,
    revokeAccess,
  };
}

// Hook to get all users with access to a specific company
export function useCompanyUsers(companyId?: string) {
  const { data: companyUsers = [], isLoading } = useQuery({
    queryKey: ['company-users', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_company_users', { _company_id: companyId! });
      
      if (error) throw error;
      return data as CompanyUser[];
    },
    enabled: !!companyId,
  });

  return { companyUsers, isLoading };
}
