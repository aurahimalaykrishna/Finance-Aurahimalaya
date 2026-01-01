import { useState } from 'react';
import { useCategories, CreateCategoryData, Category } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, FolderOpen, ChevronRight, ChevronDown, FolderPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Categories() {
  const { 
    categories, 
    incomeCategories, 
    expenseCategories, 
    isLoading, 
    createCategory, 
    deleteCategory,
    getSubCategories,
    hasSubCategories,
  } = useCategories();
  
  const [open, setOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    type: 'expense',
    color: COLORS[0],
    icon: 'folder',
    parent_id: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCategory.mutateAsync(formData);
    setOpen(false);
    setFormData({ name: '', type: 'expense', color: COLORS[0], icon: 'folder', parent_id: null });
  };

  const handleAddSubCategory = (parent: Category) => {
    setFormData({
      name: '',
      type: parent.type,
      color: parent.color,
      icon: 'folder',
      parent_id: parent.id,
    });
    setOpen(true);
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Get parent categories for a specific type
  const getParentCategoriesByType = (type: 'income' | 'expense') => 
    categories.filter(c => c.type === type && c.parent_id === null);

  const CategoryCard = ({ category, isSubCategory = false }: { category: Category; isSubCategory?: boolean }) => {
    const subCategories = getSubCategories(category.id);
    const hasChildren = subCategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    if (isSubCategory) {
      return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 ml-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
              <FolderOpen className="w-4 h-4" style={{ color: category.color }} />
            </div>
            <div>
              <p className="font-medium text-sm">{category.name}</p>
              <p className="text-xs text-muted-foreground">Sub-category</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => deleteCategory.mutate(category.id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Collapsible open={isExpanded} onOpenChange={() => hasChildren && toggleExpanded(category.id)}>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              {hasChildren ? (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              ) : (
                <div className="w-6" />
              )}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
                <FolderOpen className="w-5 h-5" style={{ color: category.color }} />
              </div>
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {category.type}
                  {hasChildren && ` • ${subCategories.length} sub-categor${subCategories.length === 1 ? 'y' : 'ies'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleAddSubCategory(category)}
                title="Add sub-category"
              >
                <FolderPlus className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => deleteCategory.mutate(category.id)}
                disabled={hasChildren}
                title={hasChildren ? 'Delete sub-categories first' : 'Delete category'}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
          <CollapsibleContent className="space-y-2 mt-2">
            {subCategories.map(sub => (
              <CategoryCard key={sub.id} category={sub} isSubCategory />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Get available parent categories for the form
  const availableParents = formData.parent_id 
    ? [] // If editing a sub-category, don't change parents
    : categories.filter(c => c.type === formData.type && c.parent_id === null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">Organize your income and expenses with parent and sub-categories</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setFormData({ name: '', type: 'expense', color: COLORS[0], icon: 'folder', parent_id: null });
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {formData.parent_id ? 'Add Sub-Category' : 'Add Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              
              {!formData.parent_id && (
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v: 'income' | 'expense') => setFormData({ ...formData, type: v, parent_id: null })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.parent_id ? (
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {categories.find(c => c.id === formData.parent_id)?.name}
                    <span className="text-muted-foreground ml-2 capitalize">
                      ({formData.type})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Parent Category (Optional)</Label>
                  <Select 
                    value={formData.parent_id || 'none'} 
                    onValueChange={(v) => setFormData({ ...formData, parent_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="None (Top Level)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {availableParents.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createCategory.isPending}>
                {createCategory.isPending ? 'Adding...' : formData.parent_id ? 'Add Sub-Category' : 'Add Category'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Expense ({expenseCategories.length})</TabsTrigger>
          <TabsTrigger value="income">Income ({incomeCategories.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-4">
          <div className="space-y-3">
            {getParentCategoriesByType('expense').length > 0 ? (
              getParentCategoriesByType('expense').map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No expense categories yet</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          <div className="space-y-3">
            {getParentCategoriesByType('income').length > 0 ? (
              getParentCategoriesByType('income').map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No income categories yet</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
