import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCompanies } from '@/hooks/useCompanies';
import { useCompanyStats } from '@/hooks/useCompanyStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyHeader } from '@/components/company/profile/CompanyHeader';
import { CompanyOverview } from '@/components/company/profile/CompanyOverview';
import { CompanyTeam } from '@/components/company/profile/CompanyTeam';
import { CompanyTransactions } from '@/components/company/profile/CompanyTransactions';
import { CompanyBankAccounts } from '@/components/company/profile/CompanyBankAccounts';
import { CompanyCategories } from '@/components/company/profile/CompanyCategories';
import { CompanyDialog } from '@/components/company/CompanyDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Building2, Users, Receipt, CreditCard, FolderOpen } from 'lucide-react';

export default function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, isLoading: companiesLoading, updateCompany, deleteCompany, setDefaultCompany } = useCompanies();
  const { stats, isLoading: statsLoading } = useCompanyStats(id);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const company = companies?.find(c => c.id === id);

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading company...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Company not found</h2>
        <p className="text-muted-foreground">The company you're looking for doesn't exist.</p>
      </div>
    );
  }

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    await deleteCompany.mutateAsync(company.id);
    navigate('/companies');
  };

  const handleSetDefault = () => {
    setDefaultCompany.mutate(company.id);
  };

  const handleSave = (data: any) => {
    updateCompany.mutate({ id: company.id, data });
    setEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <CompanyHeader
        company={company}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <Building2 className="h-4 w-4 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4 hidden sm:inline" />
            Team
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Receipt className="h-4 w-4 hidden sm:inline" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="bank-accounts" className="gap-2">
            <CreditCard className="h-4 w-4 hidden sm:inline" />
            Bank Accounts
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4 hidden sm:inline" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CompanyOverview company={company} stats={stats} />
        </TabsContent>

        <TabsContent value="team">
          <CompanyTeam companyId={company.id} />
        </TabsContent>

        <TabsContent value="transactions">
          <CompanyTransactions
            companyId={company.id}
            transactions={stats.recentTransactions}
            currency={company.currency || 'USD'}
          />
        </TabsContent>

        <TabsContent value="bank-accounts">
          <CompanyBankAccounts companyId={company.id} currency={company.currency || 'USD'} />
        </TabsContent>

        <TabsContent value="categories">
          <CompanyCategories companyId={company.id} />
        </TabsContent>
      </Tabs>

      <CompanyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        company={company}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{company.name}"? This action cannot be undone.
              All associated data will remain but will no longer be linked to this company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
