import { z } from 'zod';

export const PortalLoginSchema = z.object({
  firmSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreatePortalAccountSchema = z.object({
  clientId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
