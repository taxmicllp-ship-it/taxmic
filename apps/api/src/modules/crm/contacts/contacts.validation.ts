import { z } from 'zod';

export const CreateContactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  title: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial();

export const ListContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
