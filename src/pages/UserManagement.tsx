import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTeamInvitations } from '@/hooks/useTeamInvitations';
import { useCompanies } from '@/hooks/useCompanies';
import { useCompanyUsers } from '@/hooks/useCompanyAccess';
import { TeamMemberCard } from '@/components/users/TeamMemberCard';
import { PendingInvitationCard } from '@/components/users/PendingInvitationCard';
import { InviteUserDialog } from '@/components/users/InviteUserDialog';
import { RoleBadge } from '@/components/users/RoleBadge';
import { usePermissions } from '@/contexts/PermissionContext';
import { Users, Mail, Shield, Search, Building2 } from 'lucide-react';

export default function UserManagement() {
  const { teamMembers, isLoading: membersLoading, userRole } = useUserRoles();
  const { invitations, isLoading: invitationsLoading } = useTeamInvitations();
  const { companies } = useCompanies();
  const { canManageUsers } = usePermissions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');

  // Get users for the selected company
  const { companyUsers } = useCompanyUsers(
    selectedCompanyFilter !== 'all' ? selectedCompanyFilter : undefined
  );

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesSearch = member.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchQuery, roleFilter]);

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

      <div className="grid gap-4 md:grid-cols-4">
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
              <Building2 className="w-4 h-4" />
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
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
          <TabsTrigger value="company-access">Company Access</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations ({invitations.length})</TabsTrigger>
          <TabsTrigger value="roles">Role Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {teamMembers.length === 0 ? 'No team members yet' : 'No members match your search'}
                </p>
                {canManageUsers && teamMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Invite team members to collaborate
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredMembers.map((member) => (
              <TeamMemberCard key={member.user_id} member={member} />
            ))
          )}
        </TabsContent>

        <TabsContent value="company-access" className="space-y-4">
          {/* Company Filter */}
          <div className="flex gap-4">
            <Select value={selectedCompanyFilter} onValueChange={setSelectedCompanyFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompanyFilter === 'all' ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a company to view user access</p>
              </CardContent>
            </Card>
          ) : companyUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users have access to this company</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Grant access from the Team Members tab
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {companyUsers.map((cu) => (
                <Card key={cu.user_id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{cu.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Granted on {new Date(cu.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <RoleBadge role={cu.role} />
                  </CardContent>
                </Card>
              ))}
            </div>
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
