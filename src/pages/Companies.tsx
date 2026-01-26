import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Star, Building2, MapPin, Eye, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCompanies, Company } from '@/hooks/useCompanies';
import { CompanyDialog } from '@/components/company/CompanyDialog';
import { useVATReturn } from '@/hooks/useVATReturn';
import { getCurrencySymbol } from '@/lib/currencies';

// Component to display VAT for each company card
function CompanyVATBadge({ companyId, currency }: { companyId: string; currency: string }) {
  const { vatData } = useVATReturn(companyId);
  const currencySymbol = getCurrencySymbol(currency);
  
  if (vatData.totalVAT === 0) return null;
  
  return (
    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded">
      <Receipt className="h-3 w-3" />
      <span>VAT: {currencySymbol}{vatData.totalVAT.toLocaleString()}</span>
    </div>
  );
}

export default function Companies() {
  const navigate = useNavigate();
  const { companies, isLoading, createCompany, updateCompany, deleteCompany, setDefaultCompany } = useCompanies();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const handleSave = (data: any) => {
    if (editingCompany) {
      updateCompany.mutate({ id: editingCompany.id, data });
    } else {
      createCompany.mutate(data);
    }
    setEditingCompany(null);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCompany(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage your businesses and organizations</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 rounded-lg">
                  <AvatarImage src={company.logo_url || undefined} alt={company.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg truncate">{company.name}</CardTitle>
                    {company.is_default && (
                      <Badge variant="secondary" className="shrink-0">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>
                  {company.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{company.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Currency:</span>
                  <p className="font-medium">{company.currency || 'USD'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fiscal Year:</span>
                  <p className="font-medium">
                    {new Date(2000, (company.fiscal_year_start || 1) - 1).toLocaleString('default', { month: 'short' })}
                  </p>
                </div>
              </div>

                <CompanyVATBadge companyId={company.id} currency={company.currency || 'NPR'} />

                <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/company/${company.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(company)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {!company.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefaultCompany.mutate(company.id)}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Set Default
                  </Button>
                )}
                {companies.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteCompany.mutate(company.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No companies yet. Create your first company to get started.</p>
          <Button onClick={handleAdd} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </Card>
      )}

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editingCompany}
        onSave={handleSave}
      />
    </div>
  );
}
