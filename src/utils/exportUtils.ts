import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Transaction } from '@/hooks/useTransactions';
import { Category } from '@/hooks/useCategories';
import { format } from 'date-fns';
import { getCurrencySymbol } from '@/lib/currencies';

interface ExportTransaction {
  Date: string;
  Type: string;
  Description: string;
  Category: string;
  Company: string;
  Amount: string;
  Currency: string;
  Reconciled: string;
}

const formatTransactionsForExport = (
  transactions: Transaction[],
  categories: Category[] = []
): ExportTransaction[] => {
  // Helper to get category display name with parent
  const getCategoryDisplayName = (transaction: Transaction) => {
    if (!transaction.categories) return 'Uncategorized';
    
    const category = categories.find(c => c.id === transaction.category_id);
    if (category?.parent_id) {
      const parent = categories.find(c => c.id === category.parent_id);
      if (parent) {
        return `${parent.name} > ${transaction.categories.name}`;
      }
    }
    return transaction.categories.name;
  };

  return transactions.map((t) => ({
    Date: format(new Date(t.date), 'yyyy-MM-dd'),
    Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    Description: t.description || '',
    Category: getCategoryDisplayName(t),
    Company: t.companies?.name || '',
    Amount: `${t.type === 'expense' ? '-' : ''}${getCurrencySymbol(t.currency || 'NPR')}${Number(t.amount).toLocaleString()}`,
    Currency: t.currency || 'NPR',
    Reconciled: t.is_reconciled ? 'Yes' : 'No',
  }));
};

export const exportToCSV = (
  transactions: Transaction[],
  filename: string = 'transactions',
  categories: Category[] = []
) => {
  const data = formatTransactionsForExport(transactions, categories);
  const csv = Papa.unparse(data);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (
  transactions: Transaction[],
  filename: string = 'transactions',
  categories: Category[] = []
) => {
  const data = formatTransactionsForExport(transactions, categories);
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  
  // Auto-size columns
  const maxWidth = 20;
  const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
