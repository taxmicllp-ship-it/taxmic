import { z } from 'zod';

export const ClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  type: z.enum(['individual', 'business', 'nonprofit']).optional(),
  status: z.enum(['active', 'inactive', 'archived', 'lead']).optional(),
  taxId: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;
