import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  debit?: string;
  credit?: string;
  reference?: string;
  balance?: string;
}

type AmountMode = 'single' | 'debit-credit';

export function ImportBankStatementDialog({ open, onOpenChange, bankAccounts, onImport }: ImportBankStatementDialogProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ date: '', description: '', amount: '' });
  const [previewData, setPreviewData] = useState<CreateBankStatementData[]>([]);
  const [amountMode, setAmountMode] = useState<AmountMode>('single');
  
  // Multi-sheet support
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Auto-detect column mappings based on common header patterns
  const autoDetectColumns = (cols: string[]) => {
    const lowerCols = cols.map(c => c.toLowerCase().trim());
    
    const patterns = {
      date: ['date', 'txn date', 'transaction date', 'value date', 'posting date', 'trans date'],
      description: ['description', 'particulars', 'narration', 'details', 'remarks', 'memo', 'transaction description'],
      amount: ['amount', 'txn amount', 'transaction amount', 'value'],
      debit: ['debit', 'dr', 'withdrawal', 'withdrawals', 'money out', 'out'],
      credit: ['credit', 'cr', 'deposit', 'deposits', 'money in', 'in'],
      balance: ['balance', 'running balance', 'closing balance', 'available balance', 'ledger balance'],
      reference: ['reference', 'ref', 'ref no', 'reference no', 'check no', 'cheque no', 'txn id', 'transaction id'],
    };

    const findMatch = (patternList: string[]): string | undefined => {
      for (const pattern of patternList) {
        const idx = lowerCols.findIndex(c => c === pattern || c.includes(pattern));
        if (idx !== -1) return cols[idx];
      }
      return undefined;
    };

    const detected = {
      date: findMatch(patterns.date) || '',
      description: findMatch(patterns.description) || '',
      amount: findMatch(patterns.amount) || '',
      debit: findMatch(patterns.debit),
      credit: findMatch(patterns.credit),
      balance: findMatch(patterns.balance),
      reference: findMatch(patterns.reference),
    };

    // Auto-set amount mode based on detected columns
    const hasDebitCredit = detected.debit && detected.credit;
    const hasSingleAmount = detected.amount && !hasDebitCredit;
    
    if (hasDebitCredit) {
      setAmountMode('debit-credit');
    } else if (hasSingleAmount) {
      setAmountMode('single');
    }

    setMapping(detected);
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        
        if (wb.SheetNames.length > 1) {
          // Multiple sheets - let user choose
          setSheets(wb.SheetNames);
          setSelectedSheet(wb.SheetNames[0]);
          loadSheetData(wb, wb.SheetNames[0]);
        } else {
          // Single sheet - load directly
          setSheets([]);
          loadSheetData(wb, wb.SheetNames[0]);
        }
        setStep('mapping');
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as Record<string, string>[];
          if (data.length > 0) {
            const cols = Object.keys(data[0]);
            setColumns(cols);
            setRawData(data);
            setSheets([]);
            autoDetectColumns(cols);
            setStep('mapping');
          }
        },
      });
    }
  }, []);

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string, autoDetect = true) => {
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });
    if (json.length > 0) {
      const cols = Object.keys(json[0]);
      setColumns(cols);
      setRawData(json);
      if (autoDetect) {
        autoDetectColumns(cols);
      }
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      loadSheetData(workbook, sheetName);
      // Reset mapping when sheet changes
      setMapping({ date: '', description: '', amount: '' });
    }
  };

  const handleMappingComplete = () => {
    const parsed: CreateBankStatementData[] = rawData.map(row => {
      let amount = 0;
      let transactionType: 'debit' | 'credit' = 'credit';

      if (amountMode === 'single') {
        // Single amount column logic
        const rawAmount = parseFloat(row[mapping.amount]?.replace(/[^0-9.-]/g, '') || '0');
        amount = Math.abs(rawAmount);
        transactionType = rawAmount < 0 ? 'debit' : 'credit';
      } else {
        // Separate debit/credit columns
        const debitVal = parseFloat(row[mapping.debit || '']?.replace(/[^0-9.-]/g, '') || '0');
        const creditVal = parseFloat(row[mapping.credit || '']?.replace(/[^0-9.-]/g, '') || '0');
        
        if (debitVal > 0) {
          amount = debitVal;
          transactionType = 'debit'; // Money going OUT (expense)
        } else if (creditVal > 0) {
          amount = creditVal;
          transactionType = 'credit'; // Money coming IN (income)
        }
      }

      const statementDate = formatDate(row[mapping.date]);
      const runningBalance = mapping.balance 
        ? parseFloat(row[mapping.balance]?.replace(/[^0-9.-]/g, '') || '0') 
        : undefined;

      return {
        bank_account_id: selectedAccountId,
        statement_date: statementDate,
        description: row[mapping.description] || '',
        amount,
        reference_number: mapping.reference ? row[mapping.reference] : undefined,
        running_balance: runningBalance,
        transaction_type: transactionType,
      };
    }).filter(item => 
      !isNaN(item.amount) && 
      item.amount > 0 && 
      item.statement_date && 
      item.statement_date.length > 0
    );

    setPreviewData(parsed);
    setStep('preview');
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Handle DD-MM-YYYY or DD/MM/YYYY format
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
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
    setAmountMode('single');
    setSheets([]);
    setSelectedSheet('');
    setWorkbook(null);
    onOpenChange(false);
  };

  const isMappingValid = () => {
    const hasDate = !!mapping.date;
    const hasDescription = !!mapping.description;
    
    if (amountMode === 'single') {
      return hasDate && hasDescription && !!mapping.amount;
    } else {
      return hasDate && hasDescription && !!mapping.debit && !!mapping.credit;
    }
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
            
            {/* Sheet selector for multi-sheet Excel files */}
            {sheets.length > 1 && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <Label>Select Sheet</Label>
                <Select value={selectedSheet} onValueChange={handleSheetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose sheet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map(sheet => (
                      <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
            </div>

            {/* Amount mode toggle */}
            <div className="space-y-3 p-3 border rounded-lg">
              <Label>Amount Type</Label>
              <RadioGroup 
                value={amountMode} 
                onValueChange={(v) => setAmountMode(v as AmountMode)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="font-normal cursor-pointer">Single Amount Column</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debit-credit" id="debit-credit" />
                  <Label htmlFor="debit-credit" className="font-normal cursor-pointer">Separate Debit/Credit</Label>
                </div>
              </RadioGroup>

              {amountMode === 'single' ? (
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
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Debit Column (Money Out) *</Label>
                    <Select value={mapping.debit || ''} onValueChange={(v) => setMapping({ ...mapping, debit: v })}>
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
                    <Label>Credit Column (Money In) *</Label>
                    <Select value={mapping.credit || ''} onValueChange={(v) => setMapping({ ...mapping, credit: v })}>
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
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Balance Column (optional)</Label>
                <Select value={mapping.balance || '__none__'} onValueChange={(v) => setMapping({ ...mapping, balance: v === '__none__' ? undefined : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference/Check # (optional)</Label>
                <Select value={mapping.reference || '__none__'} onValueChange={(v) => setMapping({ ...mapping, reference: v === '__none__' ? undefined : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
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
                disabled={!isMappingValid()}
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
                    {mapping.balance && <TableHead className="text-right">Balance</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.statement_date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                      <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                      <TableCell>{item.transaction_type}</TableCell>
                      {mapping.balance && (
                        <TableCell className="text-right">
                          {item.running_balance !== undefined ? `$${item.running_balance.toFixed(2)}` : '-'}
                        </TableCell>
                      )}
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
