import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTeamInvitations } from '@/hooks/useTeamInvitations';
import { TeamMemberCard } from '@/components/users/TeamMemberCard';
import { PendingInvitationCard } from '@/components/users/PendingInvitationCard';
import { InviteUserDialog } from '@/components/users/InviteUserDialog';
import { RoleBadge } from '@/components/users/RoleBadge';
import { usePermissions } from '@/contexts/PermissionContext';
import { Users, Mail, Shield } from 'lucide-react';

export default function UserManagement() {
  const { teamMembers, isLoading: membersLoading, userRole } = useUserRoles();
  const { invitations, isLoading: invitationsLoading } = useTeamInvitations();
  const { canManageUsers } = usePermissions();

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage team members and permissions</p>
        </div>
        <div className="flex items-center gap-4">
          {userRole && <RoleBadge role={userRole} />}
          {canManageUsers && <InviteUserDialog />}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userRole || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Team Members ({teamMembers.length})</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations ({invitations.length})</TabsTrigger>
          <TabsTrigger value="roles">Role Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {teamMembers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No team members yet</p>
                {canManageUsers && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Invite team members to collaborate
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            teamMembers.map((member) => (
              <TeamMemberCard key={member.user_id} member={member} />
            ))
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending invitations</p>
              </CardContent>
            </Card>
          ) : (
            invitations.map((invitation) => (
              <PendingInvitationCard key={invitation.id} invitation={invitation} />
            ))
          )}
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RoleBadge role="owner" />
                </CardTitle>
                <CardDescription>Full account control</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Manage team members and roles</li>
                  <li>• Access all settings</li>
                  <li>• Create, edit, delete all data</li>
                  <li>• Manage companies</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RoleBadge role="admin" />
                </CardTitle>
                <CardDescription>Full access except user management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Access all settings</li>
                  <li>• Create, edit, delete all data</li>
                  <li>• Manage companies</li>
                  <li>• Cannot manage users</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RoleBadge role="accountant" />
                </CardTitle>
                <CardDescription>Data entry and management</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Create and edit transactions</li>
                  <li>• Manage categories and budgets</li>
                  <li>• Perform reconciliation</li>
                  <li>• View reports and dashboards</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RoleBadge role="viewer" />
                </CardTitle>
                <CardDescription>Read-only access</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• View dashboards and reports</li>
                  <li>• View transactions and categories</li>
                  <li>• No editing capabilities</li>
                  <li>• Cannot access settings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
