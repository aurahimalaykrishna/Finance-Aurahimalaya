import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { ColumnMappingStep } from './ColumnMappingStep';
import { PreviewStep } from './PreviewStep';
import { ImportProgress } from './ImportProgress';
import { parseFile, ColumnMapping, ParsedRow, validateRows } from '@/utils/importUtils';
import { useToast } from '@/hooks/use-toast';

interface ImportTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: string; name: string; type: string }>;
  onImport: (transactions: Array<{
    date: string;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    category_id?: string;
  }>) => Promise<void>;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export function ImportTransactionsDialog({
  open,
  onOpenChange,
  categories,
  onImport,
}: ImportTransactionsDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: null,
    amount: null,
    description: null,
    type: null,
    category: null,
  });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState({ success: 0, failed: 0 });
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({ date: null, amount: null, description: null, type: null, category: null });
    setParsedRows([]);
    setSelectedRows(new Set());
    setImportProgress({ current: 0, total: 0 });
    setImportResult({ success: 0, failed: 0 });
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  }, [onOpenChange, resetState]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    try {
      const result = await parseFile(selectedFile);
      
      if (result.rows.length === 0) {
        toast({
          title: 'Empty file',
          description: 'The file contains no data rows.',
          variant: 'destructive',
        });
        return;
      }

      if (result.rows.length > 500) {
        toast({
          title: 'Too many rows',
          description: 'Maximum 500 rows per import. Please split your file.',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
      setHeaders(result.headers);
      setRows(result.rows);
      setMapping(result.suggestedMapping);
      setStep('mapping');
    } catch (error) {
      toast({
        title: 'Failed to parse file',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  }, [handleFileSelect]);

  const handleMappingComplete = useCallback(() => {
    if (!mapping.date || !mapping.amount) {
      toast({
        title: 'Missing required mappings',
        description: 'Date and Amount columns are required.',
        variant: 'destructive',
      });
      return;
    }

    const validated = validateRows(rows, mapping, categories);
    setParsedRows(validated);
    
    // Select all valid rows by default
    const validIndices = new Set(
      validated.map((row, i) => (row.isValid ? i : -1)).filter(i => i >= 0)
    );
    setSelectedRows(validIndices);
    setStep('preview');
  }, [mapping, rows, categories, toast]);

  const handleImport = useCallback(async () => {
    const toImport = parsedRows
      .filter((_, i) => selectedRows.has(i))
      .map(row => ({
        date: row.date,
        amount: row.amount,
        description: row.description,
        type: row.type,
        category_id: row.category,
      }));

    if (toImport.length === 0) {
      toast({
        title: 'No rows selected',
        description: 'Please select at least one row to import.',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImportProgress({ current: 0, total: toImport.length });

    try {
      // Batch import in chunks
      const batchSize = 50;
      let success = 0;
      let failed = 0;

      for (let i = 0; i < toImport.length; i += batchSize) {
        const batch = toImport.slice(i, i + batchSize);
        try {
          await onImport(batch);
          success += batch.length;
        } catch {
          failed += batch.length;
        }
        setImportProgress({ current: Math.min(i + batchSize, toImport.length), total: toImport.length });
      }

      setImportResult({ success, failed });
      setStep('complete');
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      setStep('preview');
    }
  }, [parsedRows, selectedRows, onImport, toast]);

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const selectedCount = selectedRows.size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Transactions
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV or Excel file containing your transactions.'}
            {step === 'mapping' && 'Map the columns in your file to transaction fields.'}
            {step === 'preview' && `Preview and validate ${parsedRows.length} transactions.`}
            {step === 'importing' && 'Importing transactions...'}
            {step === 'complete' && 'Import complete!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop your file here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports CSV, XLSX, and XLS files (max 500 rows)
              </p>
            </div>
          )}

          {step === 'mapping' && (
            <ColumnMappingStep
              headers={headers}
              mapping={mapping}
              onMappingChange={setMapping}
              sampleRows={rows.slice(0, 3)}
            />
          )}

          {step === 'preview' && (
            <PreviewStep
              rows={parsedRows}
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
            />
          )}

          {step === 'importing' && (
            <ImportProgress
              current={importProgress.current}
              total={importProgress.total}
            />
          )}

          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Import Complete</h3>
              <p className="text-muted-foreground mb-4">
                Successfully imported {importResult.success} transaction{importResult.success !== 1 ? 's' : ''}.
                {importResult.failed > 0 && (
                  <span className="text-destructive">
                    {' '}{importResult.failed} failed.
                  </span>
                )}
              </p>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        {(step === 'mapping' || step === 'preview') && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(step === 'mapping' ? 'upload' : 'mapping')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex items-center gap-4">
              {step === 'preview' && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-primary">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {invalidCount} invalid
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{selectedCount} selected</span>
                </div>
              )}
              
              <Button
                onClick={step === 'mapping' ? handleMappingComplete : handleImport}
                disabled={step === 'preview' && selectedCount === 0}
              >
                {step === 'mapping' ? (
                  <>
                    Preview
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
