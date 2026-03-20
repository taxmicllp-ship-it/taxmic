import { z } from 'zod';

export const CreateNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum([
    'task_assigned',
    'task_completed',
    'invoice_sent',
    'invoice_paid',
    'document_uploaded',
    'comment_added',
    'user_invited',
  ]),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  entity_type: z.string().max(50).optional(),
  entity_id: z.string().uuid().optional(),
});

export const ListNotificationsQuerySchema = z.object({
  is_read: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ListEmailEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
