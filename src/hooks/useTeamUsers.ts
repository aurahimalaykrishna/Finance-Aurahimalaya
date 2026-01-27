import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamUser {
  id: string;
  email: string | null;
  full_name: string | null;
}

export function useTeamUsers() {
  const { user } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['team-users', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all team members using the existing function
      const { data: teamMembers, error: teamError } = await supabase
        .rpc('get_team_members', { _owner_id: user.id });

      if (teamError) throw teamError;

      // Get profile details for each team member
      const userIds = teamMembers?.map((m: { user_id: string }) => m.user_id) || [];
      
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      return (profiles || []) as TeamUser[];
    },
    enabled: !!user,
  });

  return {
    users,
    isLoading,
  };
}
