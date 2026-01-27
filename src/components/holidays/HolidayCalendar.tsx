import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyHoliday } from '@/hooks/useCompanyHolidays';

interface HolidayCalendarProps {
  holidays: CompanyHoliday[];
  onDateClick?: (date: Date, existingHoliday?: CompanyHoliday) => void;
}

export function HolidayCalendar({ holidays, onDateClick }: HolidayCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getHolidayForDate = (date: Date): CompanyHoliday | undefined => {
    return holidays.find((h) => isSameDay(new Date(h.date), date));
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const holiday = getHolidayForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick?.(day, holiday)}
              className={cn(
                'relative p-2 h-12 text-sm rounded-md transition-colors',
                'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
                !isCurrentMonth && 'text-muted-foreground opacity-50',
                isCurrentDay && 'ring-2 ring-primary',
                holiday && 'bg-primary/10 hover:bg-primary/20'
              )}
            >
              <span
                className={cn(
                  'block',
                  holiday && 'font-semibold text-primary'
                )}
              >
                {format(day, 'd')}
              </span>
              {holiday && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full ring-2 ring-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
