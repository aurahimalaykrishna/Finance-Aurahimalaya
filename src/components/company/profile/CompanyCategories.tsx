import { FolderOpen, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/useCategories';
import * as LucideIcons from 'lucide-react';

interface CompanyCategoriesProps {
  companyId: string;
}

export function CompanyCategories({ companyId }: CompanyCategoriesProps) {
  const { categories, isLoading } = useCategories(companyId);

  const incomeCategories = categories?.filter(c => c.type === 'income') || [];
  const expenseCategories = categories?.filter(c => c.type === 'expense') || [];

  const getIcon = (iconName: string | null) => {
    if (!iconName) return FolderOpen;
    const IconComponent = (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1)];
    return IconComponent || FolderOpen;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const CategoryList = ({ 
    items, 
    type 
  }: { 
    items: typeof incomeCategories; 
    type: 'income' | 'expense' 
  }) => {
    const colorClass = type === 'income' 
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
      : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300';

    return (
      <div>
        <h4 className={`font-medium mb-3 ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {type === 'income' ? 'Income' : 'Expense'} Categories ({items.length})
        </h4>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((category) => {
              const Icon = getIcon(category.icon);
              return (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div
                    className="p-1.5 rounded"
                    style={{ backgroundColor: category.color || '#6366f1' }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="secondary" className={`ml-auto text-xs ${colorClass}`}>
                    {type}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No {type} categories yet.
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Categories
            </CardTitle>
            <CardDescription>
              Income and expense categories for this company
            </CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <CategoryList items={incomeCategories} type="income" />
          <CategoryList items={expenseCategories} type="expense" />
        </div>
      </CardContent>
    </Card>
  );
}
