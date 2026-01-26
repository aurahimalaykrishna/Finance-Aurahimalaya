import { Badge } from '@/components/ui/badge';
import type { InvoiceStatus } from '@/hooks/useInvoices';
import { FileText, Send, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className: string }> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    icon: FileText,
    className: 'bg-muted text-muted-foreground',
  },
  sent: {
    label: 'Sent',
    variant: 'default',
    icon: Send,
    className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  },
  paid: {
    label: 'Paid',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
    icon: AlertCircle,
    className: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'outline',
    icon: XCircle,
    className: 'bg-muted text-muted-foreground line-through',
  },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
