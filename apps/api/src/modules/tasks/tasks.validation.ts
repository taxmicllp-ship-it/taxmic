import { z } from 'zod';

const TaskStatusEnum = z.enum(['new', 'in_progress', 'waiting_client', 'review', 'completed']);
const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  due_date: z.string().date().optional(),
  client_id: z.string().uuid().optional(),
  assignee_ids: z.array(z.string().uuid()).optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  due_date: z.string().date().nullable().optional(),
  client_id: z.string().uuid().optional(),
  assignee_ids: z.array(z.string().uuid()).optional(),
});

export const ListTasksQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  status: TaskStatusEnum.optional(),
  due_date: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
