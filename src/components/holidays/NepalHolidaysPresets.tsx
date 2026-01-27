import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CompanyHoliday, CreateHolidayData } from '@/hooks/useCompanyHolidays';
import { NepalHolidayPreset } from '@/data/nepalHolidays';
import { Check } from 'lucide-react';

interface NepalHolidaysPresetsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  presetName: string;
  holidays: NepalHolidayPreset[];
  existingHolidays: CompanyHoliday[];
  onImport: (holidays: CreateHolidayData[]) => Promise<void>;
  isLoading?: boolean;
}

interface SelectableHoliday extends NepalHolidayPreset {
  isDuplicate: boolean;
  selected: boolean;
}

export function NepalHolidaysPresets({
  open,
  onOpenChange,
  companyId,
  presetName,
  holidays,
  existingHolidays,
  onImport,
  isLoading,
}: NepalHolidaysPresetsProps) {
  const existingDates = new Set(existingHolidays.map((h) => h.date));

  const initialHolidays: SelectableHoliday[] = holidays.map((h) => ({
    ...h,
    isDuplicate: existingDates.has(h.date),
    selected: !existingDates.has(h.date),
  }));

  const [selectableHolidays, setSelectableHolidays] = useState(initialHolidays);

  const toggleSelection = (index: number) => {
    setSelectableHolidays((prev) =>
      prev.map((h, i) =>
        i === index && !h.isDuplicate ? { ...h, selected: !h.selected } : h
      )
    );
  };

  const toggleSelectAll = () => {
    const nonDuplicates = selectableHolidays.filter((h) => !h.isDuplicate);
    const allSelected = nonDuplicates.every((h) => h.selected);

    setSelectableHolidays((prev) =>
      prev.map((h) =>
        h.isDuplicate ? h : { ...h, selected: !allSelected }
      )
    );
  };

  const handleImport = async () => {
    const toImport = selectableHolidays
      .filter((h) => h.selected)
      .map((h) => ({
        company_id: companyId,
        name: h.name,
        date: h.date,
        description: h.description,
      }));

    if (toImport.length === 0) return;

    await onImport(toImport);
    onOpenChange(false);
  };

  const selectedCount = selectableHolidays.filter((h) => h.selected).length;
  const duplicateCount = selectableHolidays.filter((h) => h.isDuplicate).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Nepal Public Holidays {presetName}</DialogTitle>
          <DialogDescription>
            Select which holidays to import for your company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">
              {holidays.length} total
            </Badge>
            <Badge variant="default">
              <Check className="mr-1 h-3 w-3" />
              {selectedCount} selected
            </Badge>
            {duplicateCount > 0 && (
              <Badge variant="outline">
                {duplicateCount} already exist (skipped)
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
                        selectableHolidays
                          .filter((h) => !h.isDuplicate)
                          .every((h) => h.selected)
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Holiday</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectableHolidays.map((holiday, index) => (
                  <TableRow
                    key={index}
                    className={holiday.isDuplicate ? 'opacity-50' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={holiday.selected}
                        disabled={holiday.isDuplicate}
                        onCheckedChange={() => toggleSelection(index)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{holiday.name}</TableCell>
                    <TableCell>
                      {format(new Date(holiday.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {holiday.description || '-'}
                    </TableCell>
                    <TableCell>
                      {holiday.isDuplicate ? (
                        <Badge variant="outline">Exists</Badge>
                      ) : (
                        <Badge variant="secondary">Ready</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0 || isLoading}
            >
              Import {selectedCount} Holidays
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
