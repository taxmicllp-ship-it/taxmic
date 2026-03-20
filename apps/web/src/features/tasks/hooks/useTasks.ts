import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks-api';
import { TasksListParams } from '../types';

export function useTasks(params?: TasksListParams) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.list(params),
  });
}
