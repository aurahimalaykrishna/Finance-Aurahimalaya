import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';

export function CompanySwitcher() {
  const { selectedCompany, companies, setSelectedCompanyId, isAllCompanies } = useCompanyContext();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-2 h-10">
          <div className="flex items-center gap-2 truncate">
            {selectedCompany?.logo_url ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedCompany.logo_url} alt={selectedCompany.name} />
                <AvatarFallback className="text-[10px]">
                  {selectedCompany.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-sm">
              {isAllCompanies ? 'All Companies' : selectedCompany?.name || 'Select Company'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem
          onClick={() => setSelectedCompanyId('all')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>All Companies</span>
          </div>
          {isAllCompanies && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => setSelectedCompanyId(company.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {company.logo_url ? (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={company.logo_url} alt={company.name} />
                  <AvatarFallback className="text-[10px]">
                    {company.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate">{company.name}</span>
              {company.is_default && (
                <span className="text-xs text-muted-foreground">(default)</span>
              )}
            </div>
            {selectedCompany?.id === company.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/companies')}>
          <Plus className="h-4 w-4 mr-2" />
          Manage Companies
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
