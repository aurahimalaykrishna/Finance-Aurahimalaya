import { useState } from 'react';
import { useCategories, CreateCategoryData, Category } from '@/hooks/useCategories';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, FolderOpen, ChevronRight, ChevronDown, FolderPlus, Pencil, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Categories() {
  const { selectedCompanyId, companies } = useCompanyContext();
  const { 
    categories, 
    incomeCategories, 
    expenseCategories, 
    isLoading, 
    createCategory, 
    updateCategory,
    deleteCategory,
    getSubCategories,
    hasSubCategories,
    getCategoryDepth,
    canHaveSubCategories,
  } = useCategories();
  
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedFormCompanyId, setSelectedFormCompanyId] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    type: 'expense',
    color: COLORS[0],
    icon: 'folder',
    parent_id: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let companyId: string | undefined;
    
    if (formData.parent_id) {
      // For sub-categories, inherit parent's company_id
      const parentCategory = categories.find(c => c.id === formData.parent_id);
      companyId = parentCategory?.company_id ?? undefined;
    } else {
      // For top-level categories, use isShared checkbox
      companyId = isShared ? undefined : (selectedCompanyId || selectedFormCompanyId || companies[0]?.id);
    }
    
    if (!isShared && !formData.parent_id && !companyId) {
      return;
    }
    
    await createCategory.mutateAsync({ ...formData, company_id: companyId });
    setOpen(false);
    setSelectedFormCompanyId(null);
    setIsShared(false);
    setFormData({ name: '', type: 'expense', color: COLORS[0], icon: 'folder', parent_id: null });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    await updateCategory.mutateAsync({
      id: editingCategory.id,
      data: {
        name: formData.name,
        color: formData.color,
        type: formData.type,
        parent_id: formData.parent_id,
      },
    });
    setEditOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', type: 'expense', color: COLORS[0], icon: 'folder', parent_id: null });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || COLORS[0],
      icon: category.icon || 'folder',
      parent_id: category.parent_id,
    });
    setEditOpen(true);
  };

  const handleAddSubCategory = (parent: Category) => {
    // If parent is shared (company_id is null), sub-category should also be shared
    setIsShared(parent.company_id === null);
    
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

  // Check if category type can be changed (only if no sub-categories)
  const canChangeType = editingCategory ? !hasSubCategories(editingCategory.id) : true;

  // Get available parent categories for editing (depth 1 and 2 can be parents)
  const getAvailableParentsForEdit = () => {
    if (!editingCategory) return [];
    const editingDepth = getCategoryDepth(editingCategory.id);
    
    // Get all descendants of the editing category to exclude them
    const getDescendantIds = (parentId: string): string[] => {
      const children = categories.filter(c => c.parent_id === parentId);
      return children.flatMap(child => [child.id, ...getDescendantIds(child.id)]);
    };
    const descendantIds = getDescendantIds(editingCategory.id);
    
    return categories.filter(c => 
      c.type === formData.type && 
      c.id !== editingCategory.id &&
      !descendantIds.includes(c.id) &&
      canHaveSubCategories(c.id)
    );
  };

  const CategoryCard = ({ category, depth = 1 }: { category: Category; depth?: number }) => {
    const subCategories = getSubCategories(category.id);
    const hasChildren = subCategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const canAddSub = depth < 3; // Only allow adding sub-categories up to tier 2

    // Calculate margin based on depth
    const marginClass = depth === 1 ? '' : depth === 2 ? 'ml-6' : 'ml-12';
    
    // Adjust styling based on depth
    const bgClass = depth === 1 ? 'bg-muted/30' : depth === 2 ? 'bg-muted/20' : 'bg-muted/10';
    const borderClass = depth === 1 ? 'border-border/50' : 'border-border/30';
    const iconSize = depth === 1 ? 'w-10 h-10' : 'w-8 h-8';
    const iconInnerSize = depth === 1 ? 'w-5 h-5' : 'w-4 h-4';
    const textSize = depth === 1 ? 'font-medium' : 'font-medium text-sm';
    const padding = depth === 1 ? 'p-4' : 'p-3';

    // Label for depth
    const depthLabel = depth === 1 ? '' : depth === 2 ? 'Sub-category' : 'Sub-sub-category';

    return (
      <div className={`space-y-2 ${marginClass}`}>
        <Collapsible open={isExpanded} onOpenChange={() => hasChildren && toggleExpanded(category.id)}>
          <div className={`flex items-center justify-between ${padding} rounded-lg ${bgClass} border ${borderClass}`}>
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
              <div className={`${iconSize} rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${category.color}20` }}>
                <FolderOpen className={iconInnerSize} style={{ color: category.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className={textSize}>{category.name}</p>
                  {!category.company_id && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      <Globe className="w-3 h-3 mr-1" />
                      Shared
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {depthLabel || category.type}
                  {hasChildren && ` • ${subCategories.length} sub-categor${subCategories.length === 1 ? 'y' : 'ies'}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {canAddSub && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleAddSubCategory(category)}
                  title="Add sub-category"
                >
                  <FolderPlus className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleEdit(category)}
                title="Edit category"
              >
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
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
              <CategoryCard key={sub.id} category={sub} depth={depth + 1} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Get available parent categories for the form (categories that can have children - depth < 3)
  const availableParents = formData.parent_id 
    ? [] // If adding a sub-category via button, don't show parent selection
    : categories.filter(c => c.type === formData.type && canHaveSubCategories(c.id));

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
            setSelectedFormCompanyId(null);
            setIsShared(false);
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
              {!formData.parent_id && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div>
                    <Label className="text-sm font-medium">Share with all companies</Label>
                    <p className="text-xs text-muted-foreground">Category will be available in all your companies</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                </div>
              )}
              {!isShared && !selectedCompanyId && companies.length > 0 && (
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select
                    value={selectedFormCompanyId || ''}
                    onValueChange={setSelectedFormCompanyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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

        {/* Edit Category Dialog */}
        <Dialog open={editOpen} onOpenChange={(isOpen) => {
          setEditOpen(isOpen);
          if (!isOpen) {
            setEditingCategory(null);
            setFormData({ name: '', type: 'expense', color: COLORS[0], icon: 'folder', parent_id: null });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              
              {/* Type - only editable for parent categories without sub-categories */}
              {editingCategory?.parent_id === null && (
                <div className="space-y-2">
                  <Label>Type</Label>
                  {canChangeType ? (
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
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm capitalize">
                      {formData.type}
                      <span className="text-muted-foreground ml-2 text-xs">(has sub-categories)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Parent Category - for sub-categories, allow changing parent */}
              {editingCategory?.parent_id !== null && (
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select 
                    value={formData.parent_id || 'none'} 
                    onValueChange={(v) => setFormData({ ...formData, parent_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="None (Top Level)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Promote to Top Level)</SelectItem>
                      {getAvailableParentsForEdit().map(cat => (
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
              <Button type="submit" className="w-full" disabled={updateCategory.isPending}>
                {updateCategory.isPending ? 'Saving...' : 'Save Changes'}
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
