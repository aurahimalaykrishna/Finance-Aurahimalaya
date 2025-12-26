import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, Phone, Building, Briefcase, Calendar, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RoleBadge } from './RoleBadge';
import type { AppRole } from '@/hooks/useUserRoles';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface UserDetailsDialogProps {
  userId: string;
  role: AppRole;
  trigger?: React.ReactNode;
}

export function UserDetailsDialog({ userId, role, trigger }: UserDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    }
  }, [open, userId]);

  const getInitials = (email: string | null, name: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.email, profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">
                  {profile.full_name || profile.email}
                </h3>
                <div className="flex items-center gap-2">
                  <RoleBadge role={role} />
                  {profile.is_active === false && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email || 'No email'}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.department && (
                <div className="flex items-center gap-3 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.department}</span>
                </div>
              )}
              {profile.job_title && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.job_title}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{role} role</span>
              </div>
              {profile.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">User not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
