import { z } from 'zod';

export const RegisterSchema = z.object({
  firmName: z.string().min(2).max(255),
  firmSlug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  firmEmail: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const LoginSchema = z.object({
  firmSlug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8),
  }),
});

export const UpdateMeSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
});
