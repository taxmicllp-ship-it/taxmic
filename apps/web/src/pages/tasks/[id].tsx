import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../../features/tasks/api/tasks-api';
import { useUpdateTask } from '../../features/tasks/hooks/useUpdateTask';
import TaskStatusBadge from '../../features/tasks/components/TaskStatusBadge';
import TaskForm from '../../features/tasks/components/TaskForm';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { getErrorMessage } from '../../lib/getErrorMessage';
import { TaskFormValues } from '../../features/tasks/validation/task.schema';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
  });

  const { mutate: updateTask, isPending } = useUpdateTask();

  const handleUpdate = (data: TaskFormValues) => {
    setEditError(null);
    const assignee_emails = data.assignees
      ? data.assignees.split(',').map((e) => e.trim()).filter(Boolean)
      : [];
    updateTask(
      { id: id!, data: { ...data, client_id: data.client_id || undefined, assignee_emails } as any },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => setEditError(getErrorMessage(err)),
      }
    );
  };

  const handleDelete = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    await tasksApi.delete(id!);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    navigate('/tasks');
    setConfirmOpen(false);
  };

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (!task) return <div className="p-6 text-sm text-gray-500">Task not found.</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{task.title}</h1>
          <TaskStatusBadge status={task.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="max-w-xl">
          <TaskForm initialData={task} onSubmit={handleUpdate} isLoading={isPending} error={editError} />
        </div>
      ) : (
        <div className="max-w-xl space-y-4">
          {task.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300">{task.description}</p>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Priority</span>
              <p className="mt-1 capitalize text-gray-900 dark:text-white">{task.priority}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Due Date</span>
              <p className="mt-1 text-gray-900 dark:text-white">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
              </p>
            </div>
            {task.completed_at && (
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">Completed At</span>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(task.completed_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">Assignees</span>
            {(task as any).assignments?.length > 0 ? (
              <ul className="mt-1 space-y-1">
                {(task as any).assignments.map((a: any) => (
                  <li key={a.userId} className="text-sm text-gray-900 dark:text-white">
                    {a.user?.firstName && a.user?.lastName
                      ? `${a.user.firstName} ${a.user.lastName}`
                      : a.user?.email ?? a.userId}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-white">No assignees.</p>
            )}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Delete Task"
        message="Delete this task? This cannot be undone."
        variant="danger"
      />
    </div>
  );
}
