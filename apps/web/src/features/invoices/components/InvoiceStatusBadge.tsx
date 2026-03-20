import Badge, { BadgeVariant } from '../../../components/ui/Badge';
import { InvoiceStatus } from '../types';

const statusMap: Record<InvoiceStatus, { variant: BadgeVariant; label: string }> = {
  draft:     { variant: 'neutral', label: 'Draft' },
  sent:      { variant: 'info',    label: 'Sent' },
  paid:      { variant: 'success', label: 'Paid' },
  overdue:   { variant: 'error',   label: 'Overdue' },
  cancelled: { variant: 'warning', label: 'Cancelled' },
};

export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const entry = statusMap[status] ?? { variant: 'neutral' as BadgeVariant, label: status };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
