import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleBadge } from './RoleBadge';
import { useTeamInvitations, type TeamInvitation } from '@/hooks/useTeamInvitations';
import { Mail, X, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface PendingInvitationCardProps {
  invitation: TeamInvitation;
}

export function PendingInvitationCard({ invitation }: PendingInvitationCardProps) {
  const { cancelInvitation } = useTeamInvitations();
  const isExpired = new Date(invitation.expires_at) < new Date();

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      await cancelInvitation.mutateAsync(invitation.id);
    }
  };

  return (
    <Card className={isExpired ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Mail className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{invitation.email}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {isExpired ? (
                  <span className="text-destructive">Expired</span>
                ) : (
                  <span>Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={invitation.role} size="sm" />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
