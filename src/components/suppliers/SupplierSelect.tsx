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

  const activeSuppliers = suppliers.filter((s) => s.is_active);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Supplier</SelectItem>
        {activeSuppliers.map((supplier) => (
          <SelectItem key={supplier.id} value={supplier.id}>
            {supplier.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
