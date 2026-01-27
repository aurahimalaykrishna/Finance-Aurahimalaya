import { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useCompanyHolidays, CompanyHoliday, CreateHolidayData } from '@/hooks/useCompanyHolidays';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { HolidayDialog } from './HolidayDialog';
import { HolidayCalendar } from './HolidayCalendar';
import { ImportHolidaysDialog } from './ImportHolidaysDialog';
import { NepalHolidaysPresets } from './NepalHolidaysPresets';
import { NEPAL_HOLIDAYS_2082_83, NEPAL_HOLIDAYS_2083_84 } from '@/data/nepalHolidays';
import { Plus, Calendar, List, Pencil, Trash2, ChevronDown, Upload, Flag } from 'lucide-react';

export function HolidayManagement() {
  const { selectedCompany } = useCompanyContext();
  const companyId = selectedCompany?.id;
  
  const {
    holidays,
    upcomingHolidays,
    pastHolidays,
    isLoading,
    createHoliday,
    createBulkHolidays,
    updateHoliday,
    deleteHoliday,
  } = useCompanyHolidays(companyId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importCsvOpen, setImportCsvOpen] = useState(false);
  const [nepalPreset, setNepalPreset] = useState<'2082/83' | '2083/84' | null>(null);

  const handleSave = async (data: CreateHolidayData | { id: string; name: string; date: string; description?: string }) => {
    if ('id' in data) {
      await updateHoliday.mutateAsync(data);
    } else {
      await createHoliday.mutateAsync(data);
    }
    setEditingHoliday(null);
  };

  const handleEdit = (holiday: CompanyHoliday) => {
    setEditingHoliday(holiday);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteHoliday.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleCalendarDateClick = (_date: Date, existingHoliday?: CompanyHoliday) => {
    if (existingHoliday) {
      handleEdit(existingHoliday);
    } else {
      setEditingHoliday(null);
      setDialogOpen(true);
    }
  };

  const handleBulkImport = async (holidaysData: CreateHolidayData[]) => {
    await createBulkHolidays.mutateAsync(holidaysData);
  };

  const getStatusBadge = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return <Badge className="bg-green-500">Today</Badge>;
    }
    if (isPast(date)) {
      return <Badge variant="secondary">Past</Badge>;
    }
    return <Badge variant="default">Upcoming</Badge>;
  };

  if (!companyId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Please select a company to manage holidays.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading holidays...
        </CardContent>
      </Card>
    );
  }

  const HolidayTable = ({ items }: { items: CompanyHoliday[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Holiday</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              No holidays found
            </TableCell>
          </TableRow>
        ) : (
          items.map((holiday) => (
            <TableRow key={holiday.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{holiday.name}</div>
                  {holiday.description && (
                    <div className="text-sm text-muted-foreground">{holiday.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{format(new Date(holiday.date), 'PPP')}</TableCell>
              <TableCell>{getStatusBadge(holiday.date)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(holiday)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirmId(holiday.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Company Holidays</CardTitle>
            <CardDescription>
              Manage statutory and company holidays for {selectedCompany?.name}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Holiday
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => { setEditingHoliday(null); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Single Holiday
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setImportCsvOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import from CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setNepalPreset('2082/83')}>
                  <Flag className="mr-2 h-4 w-4" />
                  Nepal 2082/83 ({NEPAL_HOLIDAYS_2082_83.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNepalPreset('2083/84')}>
                  <Flag className="mr-2 h-4 w-4" />
                  Nepal 2083/84 ({NEPAL_HOLIDAYS_2083_84.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Upcoming ({upcomingHolidays.length})
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="all">
                All Holidays ({holidays.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4">
              <HolidayTable items={upcomingHolidays} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-4">
              <HolidayCalendar
                holidays={holidays}
                onDateClick={handleCalendarDateClick}
              />
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <HolidayTable items={holidays} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <HolidayDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingHoliday(null);
        }}
        holiday={editingHoliday}
        companyId={companyId}
        onSave={handleSave}
        isLoading={createHoliday.isPending || updateHoliday.isPending}
      />

      <ImportHolidaysDialog
        open={importCsvOpen}
        onOpenChange={setImportCsvOpen}
        companyId={companyId}
        existingHolidays={holidays}
        onImport={handleBulkImport}
        isLoading={createBulkHolidays.isPending}
      />

      {nepalPreset && (
        <NepalHolidaysPresets
          open={!!nepalPreset}
          onOpenChange={(open) => !open && setNepalPreset(null)}
          companyId={companyId}
          presetName={nepalPreset}
          holidays={nepalPreset === '2082/83' ? NEPAL_HOLIDAYS_2082_83 : NEPAL_HOLIDAYS_2083_84}
          existingHolidays={holidays}
          onImport={handleBulkImport}
          isLoading={createBulkHolidays.isPending}
        />
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holiday? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
