import TaskStatusBadge from '../../features/tasks/components/TaskStatusBadge';
import { usePortalTasks } from '../../features/portal/hooks/usePortalTasks';
import type { TaskStatus } from '../../features/tasks/types';

const priorityLabel: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const priorityClass: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export default function PortalTasksPage() {
  const { data: tasks, isLoading } = usePortalTasks();

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Tasks</h1>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : !tasks?.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No tasks yet.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{task.title}</td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={task.status as TaskStatus} />
                  </td>
                  <td className={`px-4 py-3 font-medium ${priorityClass[task.priority] ?? 'text-gray-500'}`}>
                    {priorityLabel[task.priority] ?? task.priority}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
