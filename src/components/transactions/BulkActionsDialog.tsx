import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategorySelect } from '@/components/categories/CategorySelect';
import { SupplierSelect } from '@/components/suppliers/SupplierSelect';

import { Category } from '@/hooks/useCategories';

interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  categories: Category[];
  companyId: string | null;
  onChangeCategory: (categoryId: string | null) => void;
  onChangeSupplier: (supplierId: string | null) => void;
  isPending: boolean;
}

export function BulkActionsDialog({
  open,
  onOpenChange,
  selectedCount,
  categories,
  companyId,
  onChangeCategory,
  onChangeSupplier,
  isPending,
}: BulkActionsDialogProps) {
  const [tab, setTab] = useState<'category' | 'supplier'>('category');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');

  const filteredCategories = categories.filter(c => c.type === categoryType);

  const handleApply = () => {
    if (tab === 'category') {
      onChangeCategory(selectedCategoryId);
    } else {
      onChangeSupplier(selectedSupplierId === 'none' ? null : selectedSupplierId);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedCategoryId(null);
      setSelectedSupplierId(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit ({selectedCount} transactions)</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'category' | 'supplier')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="category">Change Category</TabsTrigger>
            <TabsTrigger value="supplier">Change Supplier</TabsTrigger>
          </TabsList>
          
          <TabsContent value="category" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Category Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={categoryType === 'expense' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCategoryType('expense');
                    setSelectedCategoryId(null);
                  }}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={categoryType === 'income' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCategoryType('income');
                    setSelectedCategoryId(null);
                  }}
                >
                  Income
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Category</Label>
              <CategorySelect
                categories={filteredCategories}
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
                type={categoryType}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="supplier" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>New Supplier</Label>
              <SupplierSelect
                value={selectedSupplierId || 'none'}
                onValueChange={setSelectedSupplierId}
                companyId={companyId}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isPending || (tab === 'category' && !selectedCategoryId)}
          >
            {isPending ? 'Applying...' : `Apply to ${selectedCount} items`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
