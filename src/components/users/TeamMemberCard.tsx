import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RoleBadge } from './RoleBadge';
import { EditUserDialog } from './EditUserDialog';
import { UserDetailsDialog } from './UserDetailsDialog';
import { useUserRoles, type AppRole, type TeamMember } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Eye, Pencil, UserX, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const { user } = useAuth();
  const { updateUserRole, removeTeamMember, canManageUsers } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(true);
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

  const handleToggleActive = async () => {
    const newStatus = !isActive;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('id', member.user_id);

    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
      return;
    }

    setIsActive(newStatus);
    toast({ title: newStatus ? 'User activated' : 'User deactivated' });
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
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
            {/* View Button */}
            <UserDetailsDialog userId={member.user_id} role={member.role} />

            {canManageUsers && !isOwner && !isCurrentUser ? (
              <>
                {/* Edit Button */}
                <EditUserDialog userId={member.user_id} email={member.email} />

                {/* Active Toggle */}
                <div className="flex items-center gap-1">
                  <Switch
                    checked={isActive}
                    onCheckedChange={handleToggleActive}
                    aria-label="Toggle user active status"
                  />
                </div>

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
