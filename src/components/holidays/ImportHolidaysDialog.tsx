import { useState, useCallback } from 'react';
import { format, parse, isValid } from 'date-fns';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportProgress } from '@/components/transactions/ImportProgress';
import { CompanyHoliday, CreateHolidayData } from '@/hooks/useCompanyHolidays';
import { Upload, AlertTriangle, Check } from 'lucide-react';

interface ImportHolidaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  existingHolidays: CompanyHoliday[];
  onImport: (holidays: CreateHolidayData[]) => Promise<void>;
  isLoading?: boolean;
}

interface ParsedRow {
  [key: string]: string;
}

interface MappedHoliday {
  name: string;
  date: string;
  description?: string;
  isDuplicate: boolean;
  isValid: boolean;
  selected: boolean;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'yyyy/MM/dd',
  'MMMM d, yyyy',
  'd MMMM yyyy',
];

function parseDate(dateStr: string): Date | null {
  for (const fmt of DATE_FORMATS) {
    const parsed = parse(dateStr, fmt, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }
  // Try native parsing as fallback
  const native = new Date(dateStr);
  if (isValid(native)) {
    return native;
  }
  return null;
}

export function ImportHolidaysDialog({
  open,
  onOpenChange,
  companyId,
  existingHolidays,
  onImport,
  isLoading,
}: ImportHolidaysDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [mappedHolidays, setMappedHolidays] = useState<MappedHoliday[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Column mappings
  const [nameColumn, setNameColumn] = useState<string>('');
  const [dateColumn, setDateColumn] = useState<string>('');
  const [descriptionColumn, setDescriptionColumn] = useState<string>('');

  const resetState = useCallback(() => {
    setStep('upload');
    setHeaders([]);
    setParsedData([]);
    setMappedHolidays([]);
    setNameColumn('');
    setDateColumn('');
    setDescriptionColumn('');
    setImportProgress({ current: 0, total: 0 });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ParsedRow[];
        if (data.length > 0) {
          const fileHeaders = Object.keys(data[0]);
          setHeaders(fileHeaders);
          setParsedData(data);

          // Auto-detect columns
          const namePatterns = ['name', 'holiday', 'title', 'event'];
          const datePatterns = ['date', 'holiday_date', 'when'];
          const descPatterns = ['description', 'notes', 'details', 'remarks'];

          fileHeaders.forEach((h) => {
            const lower = h.toLowerCase();
            if (namePatterns.some((p) => lower.includes(p))) setNameColumn(h);
            if (datePatterns.some((p) => lower.includes(p))) setDateColumn(h);
            if (descPatterns.some((p) => lower.includes(p))) setDescriptionColumn(h);
          });

          setStep('mapping');
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
      },
    });

    // Reset input
    e.target.value = '';
  };

  const handleMapping = () => {
    if (!nameColumn || !dateColumn) return;

    const existingDates = new Set(existingHolidays.map((h) => h.date));

    const mapped: MappedHoliday[] = parsedData
      .map((row) => {
        const name = row[nameColumn]?.trim();
        const dateStr = row[dateColumn]?.trim();
        const description = descriptionColumn ? row[descriptionColumn]?.trim() : undefined;

        const parsedDate = parseDate(dateStr);
        const formattedDate = parsedDate ? format(parsedDate, 'yyyy-MM-dd') : '';
        const isValidRow = !!name && !!formattedDate;
        const isDuplicate = existingDates.has(formattedDate);

        return {
          name: name || '',
          date: formattedDate,
          description,
          isDuplicate,
          isValid: isValidRow,
          selected: isValidRow && !isDuplicate,
        };
      })
      .filter((h) => h.name || h.date); // Remove completely empty rows

    setMappedHolidays(mapped);
    setStep('preview');
  };

  const toggleSelection = (index: number) => {
    setMappedHolidays((prev) =>
      prev.map((h, i) =>
        i === index && h.isValid && !h.isDuplicate ? { ...h, selected: !h.selected } : h
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = mappedHolidays
      .filter((h) => h.isValid && !h.isDuplicate)
      .every((h) => h.selected);

    setMappedHolidays((prev) =>
      prev.map((h) =>
        h.isValid && !h.isDuplicate ? { ...h, selected: !allSelected } : h
      )
    );
  };

  const handleImport = async () => {
    const toImport = mappedHolidays
      .filter((h) => h.selected)
      .map((h) => ({
        company_id: companyId,
        name: h.name,
        date: h.date,
        description: h.description,
      }));

    if (toImport.length === 0) return;

    setStep('importing');
    setImportProgress({ current: 0, total: toImport.length });

    try {
      await onImport(toImport);
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Import error:', error);
      setStep('preview');
    }
  };

  const selectedCount = mappedHolidays.filter((h) => h.selected).length;
  const duplicateCount = mappedHolidays.filter((h) => h.isDuplicate).length;
  const invalidCount = mappedHolidays.filter((h) => !h.isValid).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetState();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Holidays from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with holiday data to bulk import.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop a CSV file, or click to select
              </p>
              <Label htmlFor="csv-upload">
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button type="button" variant="secondary" asChild>
                  <span>Select CSV File</span>
                </Button>
              </Label>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Expected CSV format:</strong>
                <pre className="mt-2 text-xs bg-muted p-2 rounded">
                  name,date,description{'\n'}
                  New Year's Day,2026-01-01,International New Year{'\n'}
                  Prithvi Jayanti,2026-01-11,Birthday of Prithvi Narayan Shah
                </pre>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {parsedData.length} rows. Map the columns to holiday fields:
            </p>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Name Column *</Label>
                <Select value={nameColumn} onValueChange={setNameColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column for name" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Column *</Label>
                <Select value={dateColumn} onValueChange={setDateColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column for date" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description Column (Optional)</Label>
                <Select value={descriptionColumn} onValueChange={setDescriptionColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column for description" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleMapping} disabled={!nameColumn || !dateColumn}>
                Preview Import
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">
                {mappedHolidays.length} total
              </Badge>
              <Badge variant="default">
                <Check className="mr-1 h-3 w-3" />
                {selectedCount} selected
              </Badge>
              {duplicateCount > 0 && (
                <Badge variant="outline">
                  {duplicateCount} duplicates (skipped)
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {invalidCount} invalid
                </Badge>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          mappedHolidays
                            .filter((h) => h.isValid && !h.isDuplicate)
                            .every((h) => h.selected)
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedHolidays.slice(0, 20).map((holiday, index) => (
                    <TableRow
                      key={index}
                      className={!holiday.isValid ? 'opacity-50' : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={holiday.selected}
                          disabled={!holiday.isValid || holiday.isDuplicate}
                          onCheckedChange={() => toggleSelection(index)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>
                        {holiday.date
                          ? format(new Date(holiday.date), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {holiday.description || '-'}
                      </TableCell>
                      <TableCell>
                        {holiday.isDuplicate ? (
                          <Badge variant="outline">Exists</Badge>
                        ) : !holiday.isValid ? (
                          <Badge variant="destructive">Invalid</Badge>
                        ) : (
                          <Badge variant="secondary">Ready</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {mappedHolidays.length > 20 && (
                <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                  Showing first 20 of {mappedHolidays.length} holidays
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0 || isLoading}>
                Import {selectedCount} Holidays
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <ImportProgress current={importProgress.current} total={importProgress.total} />
        )}
      </DialogContent>
    </Dialog>
  );
}
