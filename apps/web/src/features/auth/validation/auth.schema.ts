import { z } from 'zod';

export const LoginSchema = z.object({
  firmSlug: z.string().min(2, 'Firm slug is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  firmName: z.string().min(2, 'Firm name must be at least 2 characters'),
  firmSlug: z.string().min(2, 'Firm slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  firmEmail: z.string().email('Enter a valid firm email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginFormValues = z.infer<typeof LoginSchema>;
export type RegisterFormValues = z.infer<typeof RegisterSchema>;
