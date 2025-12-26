import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RoleBadge } from './RoleBadge';
import { useUserRoles, type AppRole, type TeamMember } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const { user } = useAuth();
  const { updateUserRole, removeTeamMember, canManageUsers } = useUserRoles();
  const isCurrentUser = member.user_id === user?.id;
  const isOwner = member.role === 'owner';

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const handleRoleChange = async (newRole: AppRole) => {
    await updateUserRole.mutateAsync({ userId: member.user_id, role: newRole });
  };

  const handleRemove = async () => {
    if (confirm('Are you sure you want to remove this team member?')) {
      await removeTeamMember.mutateAsync(member.user_id);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(member.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{member.email}</p>
                {isCurrentUser && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Joined {format(new Date(member.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManageUsers && !isOwner && !isCurrentUser ? (
              <>
                <Select value={member.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemove}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <RoleBadge role={member.role} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
