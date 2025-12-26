import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCompanies, Company } from '@/hooks/useCompanies';

interface CompanyContextType {
  selectedCompanyId: string | null;
  selectedCompany: Company | null;
  companies: Company[];
  isLoading: boolean;
  setSelectedCompanyId: (id: string | null) => void;
  isAllCompanies: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedCompanyId';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { companies, isLoading, defaultCompany } = useCompanies();
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored;
  });

  // Set default company when companies load and no selection
  useEffect(() => {
    if (!isLoading && companies.length > 0 && selectedCompanyId === null) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'all') {
        setSelectedCompanyIdState('all');
      } else if (stored && companies.find(c => c.id === stored)) {
        setSelectedCompanyIdState(stored);
      } else if (defaultCompany) {
        setSelectedCompanyIdState(defaultCompany.id);
        localStorage.setItem(STORAGE_KEY, defaultCompany.id);
      }
    }
  }, [companies, isLoading, defaultCompany, selectedCompanyId]);

  const setSelectedCompanyId = (id: string | null) => {
    setSelectedCompanyIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectedCompany = selectedCompanyId === 'all' 
    ? null 
    : companies.find(c => c.id === selectedCompanyId) || null;

  const isAllCompanies = selectedCompanyId === 'all';

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId: isAllCompanies ? null : selectedCompanyId,
        selectedCompany,
        companies,
        isLoading,
        setSelectedCompanyId,
        isAllCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}
