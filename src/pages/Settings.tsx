import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/useCompanies';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/lib/currencies';

export default function Settings() {
  const { profile, isLoading, updateProfile } = useProfile();
  const { selectedCompany, isAllCompanies } = useCompanyContext();
  const { updateCompany } = useCompanies();
  
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('NPR');
  const [companyCurrency, setCompanyCurrency] = useState('NPR');

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setCurrency(profile.currency || 'NPR');
    }
  }, [profile]);

  useEffect(() => {
    if (selectedCompany) {
      setCompanyCurrency(selectedCompany.currency || 'NPR');
    }
  }, [selectedCompany]);

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync({ business_name: businessName, currency });
  };

  const handleSaveCompanyCurrency = async () => {
    if (selectedCompany) {
      await updateCompany.mutateAsync({ 
        id: selectedCompany.id, 
        data: { currency: companyCurrency }
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Update your business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input 
              value={businessName} 
              onChange={(e) => setBusinessName(e.target.value)} 
              placeholder="Your Business Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <p className="text-xs text-muted-foreground">Used when viewing "All Companies"</p>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {!isAllCompanies && selectedCompany && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Company Settings: {selectedCompany.name}</CardTitle>
            <CardDescription>Settings for the currently selected company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Currency</Label>
              <p className="text-xs text-muted-foreground">Currency used for this company's transactions and reports</p>
              <Select value={companyCurrency} onValueChange={setCompanyCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveCompanyCurrency} disabled={updateCompany.isPending}>
              {updateCompany.isPending ? 'Updating...' : 'Update Company Currency'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
