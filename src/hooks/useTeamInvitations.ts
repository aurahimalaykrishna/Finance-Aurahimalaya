import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from './useUserRoles';

export interface TeamInvitation {
  id: string;
  email: string;
  role: AppRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  company_id: string | null;
}

interface CompanyAccessInput {
  companyId: string;
  role: AppRole;
}

export function useTeamInvitations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['team-invitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TeamInvitation[];
    },
    enabled: !!user,
  });

  const sendInvitation = useMutation({
    mutationFn: async ({ 
      email, 
      role,
      companyAccess = []
    }: { 
      email: string; 
      role: AppRole;
      companyAccess?: CompanyAccessInput[];
    }) => {
      // Create the main invitation
      const { data: invitation, error } = await supabase
        .from('team_invitations')
        .insert({
          email,
          role,
          invited_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      // If company access is specified, store it for later processing
      // The company_access entries will be created when the invitation is accepted
      // For now, we store company-specific invitations separately
      if (companyAccess.length > 0) {
        const companyInvitations = companyAccess.map(ca => ({
          email,
          role: ca.role,
          invited_by: user!.id,
          company_id: ca.companyId,
        }));

        const { error: companyError } = await supabase
          .from('team_invitations')
          .insert(companyInvitations);

        if (companyError) throw companyError;
      }

      return invitation;
    },
    onSuccess: (_, { email }) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      toast({ title: 'Invitation sent', description: `Invitation sent to ${email}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error sending invitation', description: error.message, variant: 'destructive' });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      toast({ title: 'Invitation cancelled' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error cancelling invitation', description: error.message, variant: 'destructive' });
    },
  });

  const acceptInvitation = useMutation({
    mutationFn: async (token: string) => {
      // Get all invitations for this token's email
      const { data: invitation, error: fetchError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', token)
        .is('accepted_at', null)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!invitation) throw new Error('Invitation not found or already accepted');
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Create user role (global role)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user!.id,
          role: invitation.role,
          granted_by: invitation.invited_by,
        });

      if (roleError) throw roleError;

      // If this is a company-specific invitation, also create company_access
      if (invitation.company_id) {
        const { error: accessError } = await supabase
          .from('company_access')
          .insert({
            user_id: user!.id,
            company_id: invitation.company_id,
            role: invitation.role,
            granted_by: invitation.invited_by,
          });

        if (accessError) throw accessError;
      }

      // Get all pending invitations for this email and mark them as accepted
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('email', invitation.email)
        .is('accepted_at', null);

      if (updateError) throw updateError;

      // Process remaining company-specific invitations
      const { data: companyInvitations } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('email', invitation.email)
        .not('company_id', 'is', null);

      if (companyInvitations && companyInvitations.length > 0) {
        const companyAccessEntries = companyInvitations.map(inv => ({
          user_id: user!.id,
          company_id: inv.company_id!,
          role: inv.role,
          granted_by: inv.invited_by,
        }));

        await supabase
          .from('company_access')
          .upsert(companyAccessEntries, { 
            onConflict: 'user_id,company_id',
            ignoreDuplicates: true 
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['company-access'] });
      toast({ title: 'Invitation accepted', description: 'You have joined the team' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error accepting invitation', description: error.message, variant: 'destructive' });
    },
  });

  return {
    invitations,
    isLoading,
    sendInvitation,
    cancelInvitation,
    acceptInvitation,
  };
}
