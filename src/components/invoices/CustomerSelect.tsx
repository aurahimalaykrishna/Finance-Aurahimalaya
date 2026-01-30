import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { useCompanyContext } from '@/contexts/CompanyContext';

interface CustomerSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onCreateNew?: () => void;
}

export function CustomerSelect({ value, onChange, onCreateNew }: CustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const { customers, isLoading } = useCustomers();
  const { selectedCompany, companies, isAllCompanies } = useCompanyContext();

  const selectedCustomer = customers.find((c) => c.id === value);

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown Company';
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCustomer ? selectedCustomer.name : 'Select customer...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <div className="flex items-center gap-2 px-3 py-2 border-b text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span>{isAllCompanies ? 'All Customers' : `Customers for ${selectedCompany?.name}`}</span>
          </div>
          <CommandInput placeholder="Search customers..." />
          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => {
                    onChange(customer.id === value ? null : customer.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === customer.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {customer.email && `${customer.email} • `}
                      {getCompanyName(customer.company_id)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new customer
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
