import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTeamInvitations } from '@/hooks/useTeamInvitations';
import { useCompanies } from '@/hooks/useCompanies';
import type { AppRole } from '@/hooks/useUserRoles';
import { UserPlus } from 'lucide-react';

interface CompanySelection {
  companyId: string;
  role: AppRole;
  selected: boolean;
}

interface InviteUserDialogProps {
  trigger?: React.ReactNode;
}

export function InviteUserDialog({ trigger }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [globalRole, setGlobalRole] = useState<AppRole>('viewer');
  const [companySelections, setCompanySelections] = useState<CompanySelection[]>([]);
  const { sendInvitation } = useTeamInvitations();
  const { companies } = useCompanies();

  // Initialize company selections when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setCompanySelections(
        companies.map(c => ({
          companyId: c.id,
          role: 'viewer' as AppRole,
          selected: false,
        }))
      );
    }
  };

  const toggleCompany = (companyId: string) => {
    setCompanySelections(prev =>
      prev.map(cs =>
        cs.companyId === companyId ? { ...cs, selected: !cs.selected } : cs
      )
    );
  };

  const updateCompanyRole = (companyId: string, role: AppRole) => {
    setCompanySelections(prev =>
      prev.map(cs =>
        cs.companyId === companyId ? { ...cs, role } : cs
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCompanies = companySelections.filter(cs => cs.selected);
    
    // Send invitation with company access info
    await sendInvitation.mutateAsync({ 
      email, 
      role: globalRole,
      companyAccess: selectedCompanies.map(cs => ({
        companyId: cs.companyId,
        role: cs.role,
      })),
    });
    
    setEmail('');
    setGlobalRole('viewer');
    setCompanySelections([]);
    setOpen(false);
  };

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Global Role</Label>
            <p className="text-xs text-muted-foreground">Default role when no company-specific role exists</p>
            <Select value={globalRole} onValueChange={(value) => setGlobalRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin - Full access except user management</SelectItem>
                <SelectItem value="accountant">Accountant - Create and edit transactions</SelectItem>
                <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                <SelectItem value="employee">Employee - Self-service leave management</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {companies.length > 0 && (
            <div className="space-y-2">
              <Label>Company Access (Optional)</Label>
              <p className="text-xs text-muted-foreground">Assign specific roles per company</p>
              <div className="border rounded-md p-3 space-y-3 max-h-48 overflow-y-auto">
                {companySelections.map((cs) => (
                  <div key={cs.companyId} className="flex items-center gap-3">
                    <Checkbox
                      id={`company-${cs.companyId}`}
                      checked={cs.selected}
                      onCheckedChange={() => toggleCompany(cs.companyId)}
                    />
                    <label 
                      htmlFor={`company-${cs.companyId}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      {getCompanyName(cs.companyId)}
                    </label>
                    {cs.selected && (
                      <Select 
                        value={cs.role} 
                        onValueChange={(v) => updateCompanyRole(cs.companyId, v as AppRole)}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendInvitation.isPending}>
              {sendInvitation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
