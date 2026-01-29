import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  type: 'income' | 'expense' | 'investment';
  icon: string;
  color: string;
  created_at: string;
  parent_id: string | null;
}

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense' | 'investment';
  icon?: string;
  color?: string;
  company_id?: string;
  parent_id?: string | null;
}

export function useCategories(companyId?: string | null, defaultCompanyIdForCreate?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', user?.id, companyId],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name');

      if (companyId) {
        // Include categories for this company OR global categories (company_id is null)
        query = query.or(`company_id.eq.${companyId},company_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });

  // Get parent categories (categories without a parent)
  const parentCategories = categories.filter(c => c.parent_id === null);
  
  // Get sub-categories for a specific parent
  const getSubCategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId);
  
  // Check if a category has sub-categories
  const hasSubCategories = (categoryId: string) => 
    categories.some(c => c.parent_id === categoryId);

  // Get the depth level of a category (1 = parent, 2 = sub, 3 = sub-sub)
  const getCategoryDepth = (categoryId: string): number => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    if (!category.parent_id) return 1;
    
    const parent = categories.find(c => c.id === category.parent_id);
    if (!parent?.parent_id) return 2;
    return 3;
  };

  // Check if a category can have children (only allow up to 3 levels)
  const canHaveSubCategories = (categoryId: string): boolean => {
    return getCategoryDepth(categoryId) < 3;
  };
  
  // Get category name with full hierarchy (e.g., "Parent > Sub > SubSub")
  const getCategoryDisplayName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    
    if (category.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      if (parent?.parent_id) {
        // This is a 3rd level category (sub-sub-category)
        const grandparent = categories.find(c => c.id === parent.parent_id);
        return grandparent 
          ? `${grandparent.name} > ${parent.name} > ${category.name}` 
          : `${parent.name} > ${category.name}`;
      }
      return parent ? `${parent.name} > ${category.name}` : category.name;
    }
    return category.name;
  };

  // Get all categories organized hierarchically (3 tiers)
  const getHierarchicalCategories = (type?: 'income' | 'expense' | 'investment') => {
    const filtered = type ? categories.filter(c => c.type === type) : categories;
    const tier1 = filtered.filter(c => c.parent_id === null);
    
    return tier1.map(parent => ({
      ...parent,
      subCategories: filtered
        .filter(c => c.parent_id === parent.id)
        .map(sub => ({
          ...sub,
          subCategories: filtered.filter(c => c.parent_id === sub.id),
        })),
    }));
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const investmentCategories = categories.filter(c => c.type === 'investment');

  const createCategory = useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      // Use explicit company_id if provided, fallback to default context, then null
      const resolvedCompanyId = data.company_id !== undefined ? data.company_id : (defaultCompanyIdForCreate || null);
      
      const { error } = await supabase.from('categories').insert({
        ...data,
        company_id: resolvedCompanyId,
        user_id: user!.id,
      } as any);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'CREATE',
        entity_type: 'category',
        new_values: data as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCategoryData> }) => {
      const oldCategory = categories.find(c => c.id === id);
      const { error } = await supabase.from('categories').update(data as any).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'UPDATE',
        entity_type: 'category',
        entity_id: id,
        old_values: oldCategory as any,
        new_values: data as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating category', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const oldCategory = categories.find(c => c.id === id);
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'DELETE',
        entity_type: 'category',
        entity_id: id,
        old_values: oldCategory as any,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting category', description: error.message, variant: 'destructive' });
    },
  });

  return {
    categories,
    incomeCategories,
    expenseCategories,
    investmentCategories,
    parentCategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    getSubCategories,
    hasSubCategories,
    getCategoryDepth,
    canHaveSubCategories,
    getCategoryDisplayName,
    getHierarchicalCategories,
  };
}
