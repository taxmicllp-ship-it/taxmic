import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks-api';
import { CreateTaskInput } from '../types';

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
