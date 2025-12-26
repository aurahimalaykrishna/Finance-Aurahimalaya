import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ImportProgressProps {
  current: number;
  total: number;
}

export function ImportProgress({ current, total }: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="py-12 space-y-6">
      <div className="flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Importing Transactions</h3>
        <p className="text-muted-foreground">
          {current} of {total} transactions processed
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Progress value={percentage} className="h-2" />
        <p className="text-center text-sm text-muted-foreground mt-2">
          {percentage}% complete
        </p>
      </div>
    </div>
  );
}
