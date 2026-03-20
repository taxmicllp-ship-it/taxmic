import { Task, TaskStatus } from '../types';
import TaskStatusBadge from './TaskStatusBadge';
import Button from '../../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '../../../components/ui/Table';

interface TaskListProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  statusFilter?: TaskStatus | '';
  onStatusFilterChange?: (status: TaskStatus | '') => void;
}

const priorityLabel: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export default function TaskList({
  tasks,
  onEdit,
  onDelete,
  statusFilter = '',
  onStatusFilterChange,
}: TaskListProps) {
  return (
    <div className="space-y-4">
      {onStatusFilterChange && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as TaskStatus | '')}
            className="rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_client">Waiting Client</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Title</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Priority</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Due Date</TableCell>
              <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-700"
                >
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <TaskStatusBadge status={task.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {priorityLabel[task.priority] ?? task.priority}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-2">
                      {onEdit && (
                        <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button size="sm" variant="outline" onClick={() => onDelete(task)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
