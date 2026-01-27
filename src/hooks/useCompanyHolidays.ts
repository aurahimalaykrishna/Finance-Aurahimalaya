import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CompanyHoliday {
  id: string;
  company_id: string;
  name: string;
  date: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateHolidayData {
  company_id: string;
  name: string;
  date: string;
  description?: string;
}

export function useCompanyHolidays(companyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['company-holidays', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_holidays')
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as CompanyHoliday[];
    },
    enabled: !!companyId,
  });

  const createHoliday = useMutation({
    mutationFn: async (data: CreateHolidayData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: holiday, error } = await supabase
        .from('company_holidays')
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return holiday;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast({ title: 'Holiday added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding holiday', description: error.message, variant: 'destructive' });
    },
  });

  const createBulkHolidays = useMutation({
    mutationFn: async (holidays: CreateHolidayData[]) => {
      if (!user) throw new Error('Not authenticated');

      const dataWithCreator = holidays.map(h => ({
        ...h,
        created_by: user.id,
      }));

      // Insert holidays one by one to skip duplicates gracefully
      const results: CompanyHoliday[] = [];
      const skipped: string[] = [];

      for (const holiday of dataWithCreator) {
        const { data, error } = await supabase
          .from('company_holidays')
          .insert(holiday)
          .select()
          .maybeSingle();

        if (error) {
          // If it's a duplicate key error, skip it
          if (error.code === '23505') {
            skipped.push(holiday.name);
            continue;
          }
          throw error;
        }
        if (data) results.push(data);
      }

      return { inserted: results, skipped };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      if (data.skipped.length > 0) {
        toast({ 
          title: `${data.inserted.length} holidays imported`,
          description: `${data.skipped.length} duplicates were skipped`,
        });
      } else {
        toast({ title: `${data.inserted.length} holidays imported successfully` });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error importing holidays', description: error.message, variant: 'destructive' });
    },
  });

  const updateHoliday = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CompanyHoliday> & { id: string }) => {
      const { error } = await supabase
        .from('company_holidays')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast({ title: 'Holiday updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating holiday', description: error.message, variant: 'destructive' });
    },
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast({ title: 'Holiday deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting holiday', description: error.message, variant: 'destructive' });
    },
  });

  // Get upcoming holidays
  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date());
  const pastHolidays = holidays.filter(h => new Date(h.date) < new Date());

  return {
    holidays,
    upcomingHolidays,
    pastHolidays,
    isLoading,
    createHoliday,
    createBulkHolidays,
    updateHoliday,
    deleteHoliday,
  };
}
