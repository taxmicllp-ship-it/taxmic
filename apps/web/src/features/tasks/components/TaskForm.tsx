import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Task } from '../types';
import { TaskSchema, TaskFormValues } from '../validation/task.schema';
import Input from '../../../components/form/InputField';
import Label from '../../../components/form/Label';
import ClientPicker from '../../../components/form/ClientPicker';

interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (data: TaskFormValues) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function TaskForm({ initialData, onSubmit, isLoading, error }: TaskFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      status: (initialData?.status as any) ?? 'new',
      priority: (initialData?.priority as any) ?? 'medium',
      due_date: initialData?.due_date ?? '',
      client_id: initialData?.client_id ?? null,
      assignees: (initialData as any)?.assignments
        ?.map((a: any) => a.user?.email ?? '')
        .filter(Boolean)
        .join(', ') ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15 p-4">
          <p className="text-sm text-error-500">{error}</p>
        </div>
      )}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" placeholder="Task title" error={!!errors.title} hint={errors.title?.message} disabled={isLoading} {...register('title')} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea id="description" rows={3} placeholder="Optional description" disabled={isLoading} {...register('description')} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" disabled={isLoading} {...register('status')} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_client">Waiting Client</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <select id="priority" disabled={isLoading} {...register('priority')} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="due_date">Due Date</Label>
        <Input id="due_date" type="date" error={!!errors.due_date} hint={errors.due_date?.message} disabled={isLoading} {...register('due_date')} />
      </div>
      <div>
        <Label htmlFor="client_id">Client (optional)</Label>
        <Controller
          name="client_id"
          control={control}
          render={({ field }) => (
            <ClientPicker
              value={field.value ?? null}
              onChange={field.onChange}
              disabled={isLoading}
              error={!!errors.client_id}
            />
          )}
        />
      </div>
      <div>
        <Label htmlFor="assignees">Assignees (emails, comma-separated)</Label>
        <Input id="assignees" type="text" placeholder="user@example.com" disabled={isLoading} {...register('assignees')} />
      </div>
      <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3.5 text-sm text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
        {isLoading ? 'Saving...' : 'Save Task'}
      </button>
    </form>
  );
}
