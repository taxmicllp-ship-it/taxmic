import { z } from 'zod';

export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof ContactSchema>;
