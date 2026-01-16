import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Category } from '@/hooks/useCategories';

interface CategorySelectProps {
  categories: Category[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  type?: 'income' | 'expense';
  placeholder?: string;
}

interface HierarchicalCategory extends Category {
  subCategories: HierarchicalCategory[];
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
  
  // Get tier 1 categories (categories without a parent_id)
  const tier1 = filtered.filter(c => c.parent_id === null);
  
  // Organize categories hierarchically (3 tiers)
  const hierarchical: HierarchicalCategory[] = tier1.map(parent => ({
    ...parent,
    subCategories: filtered
      .filter(c => c.parent_id === parent.id)
      .map(sub => ({
        ...sub,
        subCategories: filtered.filter(c => c.parent_id === sub.id).map(subSub => ({
          ...subSub,
          subCategories: [],
        })),
      })),
  }));

  // Render a category item with proper indentation
  const renderCategoryItem = (
    category: HierarchicalCategory, 
    depth: number, 
    parentPath: string = ''
  ) => {
    const hasSubCategories = category.subCategories.length > 0;
    const displayPath = parentPath 
      ? `${parentPath} > ${category.name}` 
      : category.name;
    
    // Indentation classes based on depth
    const paddingClass = depth === 0 ? 'pl-2' : depth === 1 ? 'pl-6' : 'pl-10';

    return (
      <div key={category.id}>
        <SelectItem value={category.id} className={paddingClass}>
          <span className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="truncate">{displayPath}</span>
          </span>
        </SelectItem>
        {hasSubCategories && category.subCategories.map(sub => 
          renderCategoryItem(sub, depth + 1, displayPath)
        )}
      </div>
    );
  };

  return (
    <Select value={value || ''} onValueChange={(v) => onValueChange(v || null)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {hierarchical.map(parent => {
          const hasSubCategories = parent.subCategories.length > 0;
          
          if (hasSubCategories) {
            // Parent with sub-categories - show as group with recursive rendering
            return (
              <SelectGroup key={parent.id}>
                <SelectLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-2 py-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: parent.color }}
                  />
                  {parent.name}
                </SelectLabel>
                {renderCategoryItem(parent, 0)}
              </SelectGroup>
            );
          }
          
          // Standalone parent (no sub-categories) - show as regular item
          return renderCategoryItem(parent, 0);
        })}
      </SelectContent>
    </Select>
  );
}
