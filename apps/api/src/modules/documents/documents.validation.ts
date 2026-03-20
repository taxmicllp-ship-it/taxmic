import { z } from 'zod';

export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional(),
});

export const ListDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  folder_id: z.string().uuid().optional(),
});
