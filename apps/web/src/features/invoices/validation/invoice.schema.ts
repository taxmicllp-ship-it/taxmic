import { z } from 'zod';

const LineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().refine((v) => parseFloat(v) > 0, { message: 'Quantity must be greater than 0' }),
  unit_price: z.string().refine((v) => parseFloat(v) >= 0, { message: 'Unit price must be 0 or more' }),
  sort_order: z.number().optional(),
});

export const InvoiceSchema = z.object({
  client_id: z.string().nullable().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().optional().refine((val) => {
    if (!val) return true;
    return new Date(val) >= new Date(new Date().toDateString());
  }, { message: 'Due date must be today or in the future' }),
  tax_amount: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(LineItemSchema).min(1, 'At least one line item is required'),
});

export type InvoiceFormValues = z.infer<typeof InvoiceSchema>;
