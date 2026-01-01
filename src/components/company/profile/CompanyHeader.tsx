import { Building2, MapPin, Star, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  address?: string | null;
  currency?: string | null;
  fiscal_year_start?: number | null;
  is_default?: boolean | null;
  created_at?: string | null;
}

interface CompanyHeaderProps {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export function CompanyHeader({ company, onEdit, onDelete, onSetDefault }: CompanyHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/companies')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Companies
      </Button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-lg border bg-card">
        <div className="flex items-center gap-4">
          {company.logo_url ? (
            <Avatar className="h-16 w-16">
              <AvatarImage src={company.logo_url} alt={company.name} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {company.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{company.name}</h1>
              {company.is_default && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>

            {company.address && (
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {company.address}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!company.is_default && (
            <Button variant="outline" size="sm" onClick={onSetDefault}>
              <Star className="h-4 w-4 mr-1" />
              Set as Default
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
