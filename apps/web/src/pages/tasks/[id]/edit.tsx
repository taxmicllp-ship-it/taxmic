import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../../../features/tasks/api/tasks-api';
import { useUpdateTask } from '../../../features/tasks/hooks/useUpdateTask';
import TaskForm from '../../../features/tasks/components/TaskForm';
import { getErrorMessage } from '../../../lib/getErrorMessage';
import { TaskFormValues } from '../../../features/tasks/validation/task.schema';
import { useState } from 'react';

export default function TaskEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editError, setEditError] = useState<string | null>(null);

  const { data: task, isLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
  });

  const { mutate: updateTask, isPending } = useUpdateTask();

  const handleSubmit = (data: TaskFormValues) => {
    setEditError(null);
    const assignee_emails = data.assignees
      ? data.assignees.split(',').map((e) => e.trim()).filter(Boolean)
      : [];
    updateTask(
      { id: id!, data: { ...data, client_id: data.client_id || undefined, assignee_emails } as any },
      {
        onSuccess: () => navigate(`/tasks/${id}`),
        onError: (err) => setEditError(getErrorMessage(err)),
      }
    );
  };

  if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading task...</div>;
  if (!task) return <div className="p-6 text-sm text-gray-500">Task not found.</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/tasks/${id}`)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back
        </button>
        <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
          Edit Task
        </h1>
      </div>
      <div className="max-w-xl">
        <TaskForm
          initialData={task}
          onSubmit={handleSubmit}
          isLoading={isPending}
          error={editError}
        />
      </div>
    </div>
  );
}
