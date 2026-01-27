import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { CompanyHoliday, CreateHolidayData } from '@/hooks/useCompanyHolidays';

interface HolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holiday?: CompanyHoliday | null;
  companyId: string;
  onSave: (data: CreateHolidayData | { id: string; name: string; date: string; description?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function HolidayDialog({
  open,
  onOpenChange,
  holiday,
  companyId,
  onSave,
  isLoading,
}: HolidayDialogProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (holiday) {
      setName(holiday.name);
      setDate(new Date(holiday.date));
      setDescription(holiday.description || '');
    } else {
      setName('');
      setDate(undefined);
      setDescription('');
    }
  }, [holiday, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !date) return;

    const data = {
      company_id: companyId,
      name: name.trim(),
      date: format(date, 'yyyy-MM-dd'),
      description: description.trim() || undefined,
    };

    if (holiday) {
      await onSave({ id: holiday.id, ...data });
    } else {
      await onSave(data);
    }

    onOpenChange(false);
  };

  const isValid = name.trim() && date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{holiday ? 'Edit Holiday' : 'Add Holiday'}</DialogTitle>
          <DialogDescription>
            {holiday ? 'Update the holiday details.' : 'Add a new company holiday.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Holiday Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dashain, Tihar, New Year"
            />
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the holiday..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {holiday ? 'Update' : 'Add'} Holiday
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
