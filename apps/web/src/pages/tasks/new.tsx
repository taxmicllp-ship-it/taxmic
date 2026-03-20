import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTask } from '../../features/tasks/hooks/useCreateTask';
import TaskForm from '../../features/tasks/components/TaskForm';
import { getErrorMessage } from '../../lib/getErrorMessage';
import { TaskFormValues } from '../../features/tasks/validation/task.schema';

export default function NewTaskPage() {
  const navigate = useNavigate();
  const { mutate: createTask, isPending } = useCreateTask();
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = (data: TaskFormValues) => {
    setApiError(null);
    createTask({ ...data, client_id: data.client_id || undefined } as any, {
      onSuccess: () => navigate('/tasks'),
      onError: (err) => setApiError(getErrorMessage(err)),
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">New Task</h1>
      </div>
      <div className="max-w-xl">
        <TaskForm onSubmit={handleSubmit} isLoading={isPending} error={apiError} />
      </div>
    </div>
  );
}
