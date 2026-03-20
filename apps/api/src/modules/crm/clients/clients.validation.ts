import { z } from 'zod';

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  type: z.enum(['individual', 'business', 'nonprofit']).optional(),
  status: z.enum(['active', 'inactive', 'archived', 'lead']).optional(),
  taxId: z.string().max(50).optional(),
  website: z.string().url().max(255).optional(),
  notes: z.string().optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export const UpdateFirmSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  website: z.string().url().max(255).optional(),
  timezone: z.string().max(50).optional(),
});

export const LinkContactSchema = z.object({
  contactId: z.string().uuid(),
});

export const ListClientsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
