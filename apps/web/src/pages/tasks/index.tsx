import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../features/tasks/hooks/useTasks';
import { useUpdateTask } from '../../features/tasks/hooks/useUpdateTask';
import { tasksApi } from '../../features/tasks/api/tasks-api';
import TaskList from '../../features/tasks/components/TaskList';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { Task, TaskStatus } from '../../features/tasks/types';
import { useQueryClient } from '@tanstack/react-query';

export default function TasksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useTasks(statusFilter ? { status: statusFilter } : undefined);
  const { mutate: updateTask } = useUpdateTask();

  const handleEdit = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (pendingDeleteId) {
      await tasksApi.delete(pendingDeleteId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tasks</h1>
        <Button onClick={() => navigate('/tasks/new')}>New Task</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading tasks...</p>
      ) : (
        <TaskList
          tasks={data?.data ?? []}
          onEdit={handleEdit}
          onDelete={(task) => handleDeleteClick(task.id)}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
        onConfirm={handleConfirm}
        title="Delete Task"
        message="Delete this task? This cannot be undone."
        variant="danger"
      />
    </div>
  );
}
