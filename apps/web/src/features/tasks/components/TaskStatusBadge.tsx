import Badge, { BadgeVariant } from '../../../components/ui/Badge';
import { TaskStatus } from '../types';

const statusMap: Record<TaskStatus, { variant: BadgeVariant; label: string }> = {
  new:            { variant: 'neutral', label: 'New' },
  in_progress:    { variant: 'info',    label: 'In Progress' },
  waiting_client: { variant: 'warning', label: 'Waiting Client' },
  review:         { variant: 'purple',  label: 'Review' },
  completed:      { variant: 'success', label: 'Completed' },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const entry = statusMap[status] ?? { variant: 'neutral' as BadgeVariant, label: status };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
