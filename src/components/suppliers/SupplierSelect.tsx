import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSuppliers } from "@/hooks/useSuppliers";

interface SupplierSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  companyId?: string | null;
  disabled?: boolean;
  placeholder?: string;
}

export function SupplierSelect({
  value,
  onValueChange,
  companyId,
  disabled,
  placeholder = "Select supplier (optional)",
}: SupplierSelectProps) {
  const { suppliers, isLoading } = useSuppliers(companyId);

  // Get active suppliers, plus include the currently selected one even if inactive
  const availableSuppliers = useMemo(() => {
    const active = suppliers.filter((s) => s.is_active);
    
    // If we have a selected value that's not in active list, find and include it
    if (value && value !== 'none') {
      const selectedSupplier = suppliers.find(s => s.id === value);
      if (selectedSupplier && !selectedSupplier.is_active) {
        return [...active, selectedSupplier];
      }
    }
    
    return active;
  }, [suppliers, value]);

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Supplier</SelectItem>
        {availableSuppliers.map((supplier) => (
          <SelectItem key={supplier.id} value={supplier.id}>
            {supplier.name}
            {!supplier.is_active && " (Inactive)"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
