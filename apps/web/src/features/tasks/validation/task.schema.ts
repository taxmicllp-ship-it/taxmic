import { z } from 'zod';

export const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['new', 'in_progress', 'waiting_client', 'review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional().refine((val) => {
    if (!val) return true;
    return new Date(val) >= new Date(new Date().toDateString());
  }, { message: 'Due date must be today or in the future' }),
  client_id: z.string().nullable().optional(),
  assignees: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof TaskSchema>;
