import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, RefreshCw, TrendingUp } from 'lucide-react';
import { CURRENCIES, getCurrencySymbol } from '@/lib/currencies';
import { useExchangeRates } from '@/hooks/useExchangeRates';

interface CurrencyConverterProps {
  defaultFrom?: string;
  defaultTo?: string;
  defaultAmount?: number;
  compact?: boolean;
}

export function CurrencyConverter({ 
  defaultFrom = 'USD', 
  defaultTo = 'NPR',
  defaultAmount = 1,
  compact = false 
}: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState(defaultFrom);
  const [toCurrency, setToCurrency] = useState(defaultTo);
  const [amount, setAmount] = useState(defaultAmount);
  const [result, setResult] = useState<{
    convertedAmount: number;
    rate: number;
    lastUpdated: string;
  } | null>(null);

  const { convertCurrency, isLoading } = useExchangeRates();

  const handleConvert = async () => {
    const data = await convertCurrency(fromCurrency, toCurrency, amount);
    if (data) {
      setResult({
        convertedAmount: data.convertedAmount,
        rate: data.rate,
        lastUpdated: data.lastUpdated,
      });
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  useEffect(() => {
    // Auto-convert on initial load
    handleConvert();
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-24"
          min={0}
          step="0.01"
        />
        <Select value={fromCurrency} onValueChange={setFromCurrency}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(c => (
              <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={handleSwap}>
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
        <Select value={toCurrency} onValueChange={setToCurrency}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map(c => (
              <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleConvert} disabled={isLoading} size="sm">
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Convert'}
        </Button>
        {result && (
          <div className="font-semibold text-primary">
            = {getCurrencySymbol(toCurrency)}{result.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Currency Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleSwap} className="mb-0.5">
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          
          <div className="space-y-2">
            <Label>To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            min={0}
            step="0.01"
            placeholder="Enter amount"
          />
        </div>

        <Button onClick={handleConvert} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            'Convert'
          )}
        </Button>

        {result && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                {getCurrencySymbol(fromCurrency)}{amount.toLocaleString()} {fromCurrency} =
              </div>
              <div className="text-2xl font-bold text-primary">
                {getCurrencySymbol(toCurrency)}{result.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>Rate: 1 {fromCurrency} = {result.rate.toFixed(4)} {toCurrency}</span>
              <span>Updated: {result.lastUpdated}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
