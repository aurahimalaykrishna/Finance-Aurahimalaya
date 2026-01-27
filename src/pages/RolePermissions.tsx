import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Shield, Users, Briefcase, UserCheck, Calculator, Eye, UserCircle } from 'lucide-react';
import type { AppRole } from '@/hooks/useUserRoles';

const ROLES: { role: AppRole; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { role: 'owner', label: 'Owner', icon: Crown, description: 'Full account control' },
  { role: 'admin', label: 'Admin', icon: Shield, description: 'Full access except user management' },
  { role: 'hr_manager', label: 'HR Manager', icon: Users, description: 'Complete HR access' },
  { role: 'manager', label: 'Manager', icon: Briefcase, description: 'Team management' },
  { role: 'supervisor', label: 'Supervisor', icon: UserCheck, description: 'Limited team management' },
  { role: 'accountant', label: 'Accountant', icon: Calculator, description: 'Financial data entry' },
  { role: 'viewer', label: 'Viewer', icon: Eye, description: 'Read-only access' },
  { role: 'employee', label: 'Employee', icon: UserCircle, description: 'Self-service only' },
];

const PERMISSIONS_MATRIX: { category: string; permissions: { name: string; roles: AppRole[] }[] }[] = [
  {
    category: 'User Management',
    permissions: [
      { name: 'Manage users & roles', roles: ['owner'] },
      { name: 'Invite team members', roles: ['owner', 'admin'] },
      { name: 'View team members', roles: ['owner', 'admin'] },
    ],
  },
  {
    category: 'Company Management',
    permissions: [
      { name: 'Create companies', roles: ['owner', 'admin'] },
      { name: 'Edit company settings', roles: ['owner', 'admin'] },
      { name: 'Delete companies', roles: ['owner'] },
      { name: 'View company data', roles: ['owner', 'admin', 'hr_manager', 'manager', 'accountant', 'viewer'] },
    ],
  },
  {
    category: 'HR & Employees',
    permissions: [
      { name: 'Add/edit employees', roles: ['owner', 'admin', 'hr_manager'] },
      { name: 'Delete employees', roles: ['owner', 'admin', 'hr_manager'] },
      { name: 'Run payroll', roles: ['owner', 'admin', 'hr_manager'] },
      { name: 'View employee records', roles: ['owner', 'admin', 'hr_manager', 'manager', 'supervisor'] },
      { name: 'Approve leave requests', roles: ['owner', 'admin', 'hr_manager', 'manager', 'supervisor'] },
      { name: 'Manage attendance', roles: ['owner', 'admin', 'hr_manager'] },
    ],
  },
  {
    category: 'Financial Data',
    permissions: [
      { name: 'Create transactions', roles: ['owner', 'admin', 'hr_manager', 'accountant'] },
      { name: 'Edit transactions', roles: ['owner', 'admin', 'hr_manager', 'accountant'] },
      { name: 'Delete transactions', roles: ['owner', 'admin'] },
      { name: 'View transactions', roles: ['owner', 'admin', 'hr_manager', 'manager', 'accountant', 'viewer'] },
      { name: 'Create invoices', roles: ['owner', 'admin', 'accountant'] },
      { name: 'Manage budgets', roles: ['owner', 'admin', 'accountant'] },
    ],
  },
  {
    category: 'Reports & Analytics',
    permissions: [
      { name: 'View reports', roles: ['owner', 'admin', 'hr_manager', 'manager', 'accountant', 'viewer'] },
      { name: 'Export data', roles: ['owner', 'admin', 'hr_manager', 'accountant'] },
      { name: 'View audit logs', roles: ['owner', 'admin'] },
    ],
  },
  {
    category: 'Self-Service',
    permissions: [
      { name: 'View own profile', roles: ['owner', 'admin', 'hr_manager', 'manager', 'supervisor', 'accountant', 'viewer', 'employee'] },
      { name: 'Apply for leave', roles: ['owner', 'admin', 'hr_manager', 'manager', 'supervisor', 'accountant', 'employee'] },
      { name: 'View own payslips', roles: ['owner', 'admin', 'hr_manager', 'manager', 'supervisor', 'accountant', 'viewer', 'employee'] },
      { name: 'View own attendance', roles: ['owner', 'admin', 'hr_manager', 'manager', 'supervisor', 'accountant', 'viewer', 'employee'] },
    ],
  },
];

export default function RolePermissions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Role Permissions</h1>
        <p className="text-muted-foreground">Overview of permissions for each role in the system</p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {ROLES.map(({ role, label, icon: Icon, description }) => (
          <Card key={role} className="text-center">
            <CardContent className="pt-4 pb-3 px-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`p-2 rounded-full ${role === 'owner' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`w-5 h-5 ${role === 'owner' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
          <CardDescription>Detailed breakdown of what each role can access</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px] sticky left-0 bg-background z-10">Permission</TableHead>
                {ROLES.map(({ role, label, icon: Icon }) => (
                  <TableHead key={role} className="text-center min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{label}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS_MATRIX.map((category) => (
                <>
                  <TableRow key={category.category} className="bg-muted/50">
                    <TableCell colSpan={ROLES.length + 1} className="font-semibold">
                      {category.category}
                    </TableCell>
                  </TableRow>
                  {category.permissions.map((permission) => (
                    <TableRow key={permission.name}>
                      <TableCell className="sticky left-0 bg-background">{permission.name}</TableCell>
                      {ROLES.map(({ role }) => (
                        <TableCell key={role} className="text-center">
                          {permission.roles.includes(role) ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>Roles are ordered by privilege level from highest to lowest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            {ROLES.map(({ role, label, icon: Icon }, index) => (
              <div key={role} className="flex items-center gap-2">
                <Badge variant={role === 'owner' ? 'default' : role === 'admin' || role === 'hr_manager' ? 'secondary' : 'outline'}>
                  <Icon className="w-3 h-3 mr-1" />
                  {label}
                </Badge>
                {index < ROLES.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
