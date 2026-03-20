import { z } from 'zod';

const LineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.string().regex(/^\d+(\.\d{1,2})?$/, 'quantity must be a positive decimal'),
  unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'unit_price must be a non-negative decimal'),
  sort_order: z.number().int().default(0),
});

export const CreateInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'issue_date must be YYYY-MM-DD'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tax_amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().default('0'),
  notes: z.string().optional(),
  items: z.array(LineItemSchema).min(1, 'At least one line item is required'),
});

export const UpdateInvoiceSchema = z.object({
  client_id: z.string().uuid().optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  tax_amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(LineItemSchema).min(1).optional(),
});

export const ListInvoicesQuerySchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  client_id: z.string().uuid().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
