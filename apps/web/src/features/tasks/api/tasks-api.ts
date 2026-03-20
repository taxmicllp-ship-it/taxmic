import api from '../../../lib/api';
import { Task, TasksListResponse, TasksListParams, CreateTaskInput, UpdateTaskInput } from '../types';

export const tasksApi = {
  list: (params?: TasksListParams) =>
    api.get<TasksListResponse>('/tasks', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (data: CreateTaskInput) =>
    api.post<Task>('/tasks', data).then((r) => r.data),

  update: (id: string, data: UpdateTaskInput) =>
    api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`),

  listByClient: (clientId: string) =>
    api.get<Task[]>(`/clients/${clientId}/tasks`).then((r) => r.data),
};
