import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Category } from '@/hooks/useCategories';

interface CategorySelectProps {
  categories: Category[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  type?: 'income' | 'expense';
  placeholder?: string;
}

export function CategorySelect({
  categories,
  value,
  onValueChange,
  type,
  placeholder = 'Select category',
}: CategorySelectProps) {
  // Filter by type if provided
  const filtered = type ? categories.filter(c => c.type === type) : categories;
  
  // Get parent categories
  const parents = filtered.filter(c => c.parent_id === null);
  
  // Organize categories hierarchically
  const hierarchical = parents.map(parent => ({
    ...parent,
    subCategories: filtered.filter(c => c.parent_id === parent.id),
  }));

  // Check if we have any sub-categories
  const hasAnySubCategories = hierarchical.some(p => p.subCategories.length > 0);

  return (
    <Select value={value || ''} onValueChange={(v) => onValueChange(v || null)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {hasAnySubCategories ? (
          // Grouped view for hierarchical categories
          hierarchical.map(parent => (
            <SelectGroup key={parent.id}>
              <SelectLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-2 py-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: parent.color }}
                />
                {parent.name}
              </SelectLabel>
              {/* Parent as selectable option */}
              <SelectItem value={parent.id} className="pl-4">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: parent.color }}
                  />
                  {parent.name}
                </span>
              </SelectItem>
              {/* Sub-categories */}
              {parent.subCategories.map(sub => (
                <SelectItem key={sub.id} value={sub.id} className="pl-8">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    {parent.name} &gt; {sub.name}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        ) : (
          // Flat list for simple categories
          filtered.map(cat => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
