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
  
  // Get parent categories (categories without a parent_id)
  const parents = filtered.filter(c => c.parent_id === null);
  
  // Organize categories hierarchically
  const hierarchical = parents.map(parent => ({
    ...parent,
    subCategories: filtered.filter(c => c.parent_id === parent.id),
  }));

  // Always use hierarchical view - show parents with their sub-categories
  // Parents without sub-categories will be shown as standalone items

  return (
    <Select value={value || ''} onValueChange={(v) => onValueChange(v || null)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {hierarchical.map(parent => {
          const hasSubCategories = parent.subCategories.length > 0;
          
          if (hasSubCategories) {
            // Parent with sub-categories - show as group
            return (
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
            );
          }
          
          // Standalone parent (no sub-categories) - show as regular item
          return (
            <SelectItem key={parent.id} value={parent.id}>
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: parent.color }}
                />
                {parent.name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
