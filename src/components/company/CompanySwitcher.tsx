import { Building2, ChevronDown, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
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
          <span>All Companies</span>
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
