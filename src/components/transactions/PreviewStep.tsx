import { useCallback, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertCircle, ArrowUpCircle, ArrowDownCircle, PiggyBank, Copy } from 'lucide-react';
import { ParsedRow, findDuplicatesInBatch } from '@/utils/importUtils';
import { cn } from '@/lib/utils';

interface PreviewStepProps {
  rows: ParsedRow[];
  selectedRows: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  duplicatesInFile?: Set<number>;
}

export function PreviewStep({ rows, selectedRows, onSelectionChange, duplicatesInFile }: PreviewStepProps) {
  // Auto-detect duplicates within the batch if not provided
  const duplicateIndices = useMemo(() => {
    return duplicatesInFile ?? findDuplicatesInBatch(rows);
  }, [rows, duplicatesInFile]);

  const toggleRow = useCallback((index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    onSelectionChange(newSelection);
  }, [selectedRows, onSelectionChange]);

  const toggleAll = useCallback(() => {
    const validIndices = rows
      .map((row, i) => (row.isValid ? i : -1))
      .filter(i => i >= 0);
    
    const allSelected = validIndices.every(i => selectedRows.has(i));
    
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(validIndices));
    }
  }, [rows, selectedRows, onSelectionChange]);

  const validRows = rows.filter(r => r.isValid);
  const allValidSelected = validRows.length > 0 && 
    validRows.every((_, i) => selectedRows.has(rows.indexOf(validRows[i])));
  
  const duplicateCount = duplicateIndices.size;

  return (
    <TooltipProvider>
      {duplicateCount > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <Copy className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {duplicateCount} duplicate row{duplicateCount !== 1 ? 's' : ''} detected in file (same date + amount + description)
          </span>
        </div>
      )}
      <ScrollArea className="h-[400px] rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left w-10">
                <Checkbox
                  checked={allValidSelected}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2 text-left w-10">Status</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isDuplicate = duplicateIndices.has(index);
              
              return (
                <tr
                  key={index}
                  className={cn(
                    'border-t transition-colors',
                    !row.isValid && 'bg-destructive/5',
                    isDuplicate && row.isValid && 'bg-amber-500/10',
                    selectedRows.has(index) && !isDuplicate && 'bg-primary/5'
                  )}
                >
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={selectedRows.has(index)}
                      onCheckedChange={() => toggleRow(index)}
                      disabled={!row.isValid}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {!row.isValid ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Error
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <ul className="text-xs list-disc pl-4">
                            {row.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    ) : isDuplicate ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 flex items-center gap-1">
                            <Copy className="h-3 w-3" />
                            Duplicate
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Same date, amount, and description as another row</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Valid
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.date || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {row.type === 'income' ? (
                      <span className="flex items-center gap-1 text-primary">
                        <ArrowUpCircle className="h-4 w-4" />
                        Income
                      </span>
                    ) : row.type === 'investment' ? (
                      <span className="flex items-center gap-1 text-blue-500">
                        <PiggyBank className="h-4 w-4" />
                        Investment
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive">
                        <ArrowDownCircle className="h-4 w-4" />
                        Expense
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 max-w-[200px] truncate">
                    {row.description || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
    </TooltipProvider>
  );
}