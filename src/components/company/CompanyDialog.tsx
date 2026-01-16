import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Company, CreateCompanyData } from '@/hooks/useCompanies';
import { CompanyImageUpload } from './CompanyImageUpload';
import { CURRENCIES } from '@/lib/currencies';

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSave: (data: CreateCompanyData) => void;
}

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function CompanyDialog({ open, onOpenChange, company, onSave }: CompanyDialogProps) {
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    currency: 'NPR',
    fiscal_year_start: 1,
    is_default: false,
    logo_url: null,
    favicon_url: null,
    address: null,
    cash_in_hand: 0,
    cash_in_bank: 0,
    investment: 0,
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        currency: company.currency || 'NPR',
        fiscal_year_start: company.fiscal_year_start || 1,
        is_default: company.is_default || false,
        logo_url: company.logo_url || null,
        favicon_url: company.favicon_url || null,
        address: company.address || null,
        cash_in_hand: company.cash_in_hand || 0,
        cash_in_bank: company.cash_in_bank || 0,
        investment: company.investment || 0,
      });
    } else {
      setFormData({
        name: '',
        currency: 'NPR',
        fiscal_year_start: 1,
        is_default: false,
        logo_url: null,
        favicon_url: null,
        address: null,
        cash_in_hand: 0,
        cash_in_bank: 0,
        investment: 0,
      });
    }
  }, [company, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit Company' : 'Add Company'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="flex gap-6">
            <CompanyImageUpload
              label="Company Logo"
              value={formData.logo_url}
              onChange={(url) => setFormData({ ...formData, logo_url: url })}
            />
            <CompanyImageUpload
              label="Favicon"
              value={formData.favicon_url}
              onChange={(url) => setFormData({ ...formData, favicon_url: url })}
              accept="image/png,image/x-icon,image/svg+xml"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
              placeholder="Enter company address"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fiscal_year">Fiscal Year Start</Label>
            <Select
              value={String(formData.fiscal_year_start)}
              onValueChange={(value) => setFormData({ ...formData, fiscal_year_start: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Financial Fields */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Financial Information</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cash_in_hand">Cash in Hand</Label>
                <Input
                  id="cash_in_hand"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cash_in_hand || 0}
                  onChange={(e) => setFormData({ ...formData, cash_in_hand: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cash_in_bank">Cash in Bank</Label>
                <Input
                  id="cash_in_bank"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cash_in_bank || 0}
                  onChange={(e) => setFormData({ ...formData, cash_in_bank: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="investment">Investment</Label>
                <Input
                  id="investment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.investment || 0}
                  onChange={(e) => setFormData({ ...formData, investment: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_default">Set as Default</Label>
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {company ? 'Save Changes' : 'Create Company'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
