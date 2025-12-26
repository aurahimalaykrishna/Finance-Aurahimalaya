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
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          email,
          role,
          invited_by: user!.id,
        });

      if (error) throw error;
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
      // Get the invitation
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

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user!.id,
          role: invitation.role,
          granted_by: invitation.invited_by,
        });

      if (roleError) throw roleError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
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
