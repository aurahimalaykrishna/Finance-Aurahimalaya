import { Users, Mail, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CompanyTeamProps {
  companyId: string;
}

const roleColors: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  accountant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export function CompanyTeam({ companyId }: CompanyTeamProps) {
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['company-team', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_company_users', {
        _company_id: companyId,
      });
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              People who have access to this company
            </CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <UserPlus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {teamMembers && teamMembers.length > 0 ? (
          <div className="space-y-3">
            {teamMembers.map((member: any) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={roleColors[member.role] || roleColors.viewer}>
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No team members have access to this company yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
