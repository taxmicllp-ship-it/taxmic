export type TaskStatus = 'new' | 'in_progress' | 'waiting_client' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAssignee {
  user_id: string;
  assigned_at: string;
}

export interface TaskResponse {
  id: string;
  firm_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_by: string | null;
  assignees: TaskAssignee[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  client_id?: string;
  assignee_ids?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  client_id?: string;
  assignee_ids?: string[];
}

export interface ListTasksQuery {
  client_id?: string;
  assignee_id?: string;
  status?: TaskStatus;
  due_date?: string;
  page: number;
  limit: number;
}

export interface PaginatedTasksResult {
  data: TaskResponse[];
  total: number;
  page: number;
  limit: number;
}
