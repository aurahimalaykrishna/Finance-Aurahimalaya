import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { BankAccount } from '@/hooks/useBankAccounts';
import type { CreateBankStatementData } from '@/hooks/useBankStatements';

interface ImportBankStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccounts: BankAccount[];
  onImport: (data: CreateBankStatementData[]) => void;
}

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  reference?: string;
  balance?: string;
}

export function ImportBankStatementDialog({ open, onOpenChange, bankAccounts, onImport }: ImportBankStatementDialogProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [previewData, setPreviewData] = useState<CreateBankStatementData[]>([]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });
        if (json.length > 0) {
          setColumns(Object.keys(json[0]));
          setRawData(json);
          setStep('mapping');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as Record<string, string>[];
          if (data.length > 0) {
            setColumns(Object.keys(data[0]));
            setRawData(data);
            setStep('mapping');
          }
        },
      });
    }
  }, []);

  const handleMappingComplete = () => {
    const parsed: CreateBankStatementData[] = rawData.map(row => {
      const amount = parseFloat(row[mapping.amount]?.replace(/[^0-9.-]/g, '') || '0');
      return {
        bank_account_id: selectedAccountId,
        statement_date: formatDate(row[mapping.date]),
        description: row[mapping.description] || '',
        amount: Math.abs(amount),
        reference_number: mapping.reference ? row[mapping.reference] : undefined,
        running_balance: mapping.balance ? parseFloat(row[mapping.balance]?.replace(/[^0-9.-]/g, '') || '0') : undefined,
        transaction_type: amount < 0 ? 'debit' : 'credit',
      };
    }).filter(item => !isNaN(item.amount) && item.statement_date);

    setPreviewData(parsed);
    setStep('preview');
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const handleImport = () => {
    onImport(previewData);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setRawData([]);
    setColumns([]);
    setMapping({ date: '', description: '', amount: '' });
    setPreviewData([]);
    setSelectedAccountId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Bank Statement</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Bank Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose account..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} {account.bank_name && `(${account.bank_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAccountId && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="statement-upload"
                />
                <label htmlFor="statement-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-muted rounded-full">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Upload bank statement</p>
                    <p className="text-sm text-muted-foreground">CSV or Excel files supported</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Map your file columns to the required fields:</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date Column *</Label>
                <Select value={mapping.date} onValueChange={(v) => setMapping({ ...mapping, date: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount Column *</Label>
                <Select value={mapping.amount} onValueChange={(v) => setMapping({ ...mapping, amount: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description Column *</Label>
                <Select value={mapping.description} onValueChange={(v) => setMapping({ ...mapping, description: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference/Check # (optional)</Label>
                <Select value={mapping.reference || ''} onValueChange={(v) => setMapping({ ...mapping, reference: v || undefined })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button 
                onClick={handleMappingComplete}
                disabled={!mapping.date || !mapping.amount || !mapping.description}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Preview: {previewData.length} entries will be imported
            </p>

            <div className="border rounded-md max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.statement_date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                      <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                      <TableCell>{item.transaction_type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {previewData.length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                ...and {previewData.length - 10} more entries
              </p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
              <Button onClick={handleImport}>Import {previewData.length} Entries</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
