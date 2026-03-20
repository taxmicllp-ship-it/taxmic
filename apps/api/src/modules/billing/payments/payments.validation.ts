import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  invoice_id: z.string().uuid('invoice_id must be a valid UUID'),
  success_url: z.string().url('success_url must be a valid URL'),
  cancel_url: z.string().url('cancel_url must be a valid URL'),
});

export type CreateCheckoutSessionDto = z.infer<typeof CreateCheckoutSessionSchema>;

// Used by POST /invoices/:id/pay — invoice_id comes from route param
export const PayInvoiceSchema = z.object({
  success_url: z.string().url('success_url must be a valid URL').optional(),
  cancel_url: z.string().url('cancel_url must be a valid URL').optional(),
});

export type PayInvoiceDto = z.infer<typeof PayInvoiceSchema>;
