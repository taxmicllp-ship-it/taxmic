import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  paymentMethodId: z.string().min(1),
});

export const updateSubscriptionSchema = z.object({
  planId: z.string().uuid().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export const createPlanSchema = z.object({
  name:           z.string().min(1),
  slug:           z.string().min(1),
  description:    z.string().optional(),
  price_monthly:  z.number().positive(),
  price_annual:   z.number().positive(),
  max_users:      z.number().int().positive().optional(),
  max_clients:    z.number().int().positive().optional(),
  max_storage_gb: z.number().int().positive().optional(),
  sort_order:     z.number().int().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();
