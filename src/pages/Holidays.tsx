import { HolidayManagement } from '@/components/holidays/HolidayManagement';
import { useCompanyContext } from '@/contexts/CompanyContext';

export default function Holidays() {
  const { selectedCompany } = useCompanyContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company Holidays</h1>
        <p className="text-muted-foreground">
          Manage public holidays for {selectedCompany?.name || 'your company'}
        </p>
      </div>
      
      <HolidayManagement />
    </div>
  );
}
