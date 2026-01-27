import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyHolidays } from '@/hooks/useCompanyHolidays';
import { MyEmployee } from '@/hooks/useMyEmployee';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { Calendar, CalendarDays, Loader2 } from 'lucide-react';

interface PortalHolidaysProps {
  employee: MyEmployee;
}

export function PortalHolidays({ employee }: PortalHolidaysProps) {
  const { holidays, upcomingHolidays, pastHolidays, isLoading } = useCompanyHolidays(employee.company_id);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    
    const daysUntil = differenceInDays(date, new Date());
    if (daysUntil > 0 && daysUntil <= 7) {
      return `In ${daysUntil} days`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const HolidayList = ({ items }: { items: typeof holidays }) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No holidays found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((holiday) => {
          const holidayDate = new Date(holiday.date);
          const dateLabel = getDateLabel(holidayDate);

          return (
            <div
              key={holiday.id}
              className="flex items-start justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{holiday.name}</h4>
                  {dateLabel && (
                    <Badge variant="secondary" className="text-xs">
                      {dateLabel}
                    </Badge>
                  )}
                </div>
                {holiday.description && (
                  <p className="text-sm text-muted-foreground">
                    {holiday.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {format(holidayDate, 'MMM d, yyyy')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(holidayDate, 'EEEE')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Company Holidays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingHolidays.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastHolidays.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({holidays.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <HolidayList items={upcomingHolidays} />
          </TabsContent>

          <TabsContent value="past">
            <HolidayList items={pastHolidays} />
          </TabsContent>

          <TabsContent value="all">
            <HolidayList items={holidays} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
