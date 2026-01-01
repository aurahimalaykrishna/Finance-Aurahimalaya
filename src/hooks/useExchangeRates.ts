import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConversionResult {
  from: string;
  to: string;
  rate: number;
  amount: number;
  convertedAmount: number;
  lastUpdated: string;
}

export function useExchangeRates() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const convertCurrency = async (
    from: string,
    to: string,
    amount: number = 1
  ): Promise<ConversionResult | null> => {
    if (from === to) {
      return {
        from,
        to,
        rate: 1,
        amount,
        convertedAmount: amount,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('exchange-rates', {
        body: { from, to, amount },
      });

      if (error) throw error;
      
      return data as ConversionResult;
    } catch (error: any) {
      console.error('Currency conversion error:', error);
      toast({
        title: 'Conversion failed',
        description: error.message || 'Failed to fetch exchange rates',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    convertCurrency,
    isLoading,
  };
}
