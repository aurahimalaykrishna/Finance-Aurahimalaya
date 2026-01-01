import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyAccess } from '@/hooks/useCompanyAccess';
import { useCompanies } from '@/hooks/useCompanies';
import { RoleBadge } from './RoleBadge';
import type { AppRole, TeamMember } from '@/hooks/useUserRoles';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface UserCompanyAccessDialogProps {
  member: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserCompanyAccessDialog({ 
  member, 
  open, 
  onOpenChange 
}: UserCompanyAccessDialogProps) {
  const { companyAccess, grantAccess, updateAccess, revokeAccess } = useCompanyAccess(member.user_id);
  const { companies } = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('viewer');
  const [isAdding, setIsAdding] = useState(false);

  // Get companies that the user doesn't have access to yet
  const availableCompanies = companies.filter(
    company => !companyAccess.some(ca => ca.company_id === company.id)
  );

  const handleAddAccess = async () => {
    if (!selectedCompanyId) return;
    
    await grantAccess.mutateAsync({
      userId: member.user_id,
      companyId: selectedCompanyId,
      role: selectedRole,
    });
    
    setSelectedCompanyId('');
    setSelectedRole('viewer');
    setIsAdding(false);
  };

  const handleUpdateRole = async (companyId: string, newRole: AppRole) => {
    await updateAccess.mutateAsync({
      userId: member.user_id,
      companyId,
      role: newRole,
    });
  };

  const handleRevokeAccess = async (companyId: string) => {
    await revokeAccess.mutateAsync({
      userId: member.user_id,
      companyId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Access for {member.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current access list */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {companyAccess.length === 0 
                ? 'No company-specific access. Using global role.' 
                : `Access to ${companyAccess.length} company(ies)`}
            </p>

            {companyAccess.map((access) => (
              <div 
                key={access.company_id} 
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <p className="font-medium">{access.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {format(new Date(access.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={access.role} 
                    onValueChange={(value) => handleUpdateRole(access.company_id, value as AppRole)}
                  >
                    <SelectTrigger className="w-32">
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
                    onClick={() => handleRevokeAccess(access.company_id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new access */}
          {isAdding ? (
            <div className="p-3 border rounded-lg bg-muted/50 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleAddAccess}
                  disabled={!selectedCompanyId || grantAccess.isPending}
                >
                  {grantAccess.isPending ? 'Adding...' : 'Add Access'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            availableCompanies.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAdding(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Company Access
              </Button>
            )
          )}

          {/* Global role info */}
          <div className="p-3 border rounded-lg bg-muted/30">
            <p className="text-sm font-medium mb-1">Global Role</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Applies when no company-specific role exists
              </p>
              <RoleBadge role={member.role} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
