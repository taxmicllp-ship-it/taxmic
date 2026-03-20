import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const DashboardQuerySchema = z
  .object({
    start_date: z.string().regex(DATE_REGEX, 'start_date must be in YYYY-MM-DD format').optional(),
    end_date:   z.string().regex(DATE_REGEX, 'end_date must be in YYYY-MM-DD format').optional(),
  })
  .superRefine((data, ctx) => {
    const hasStart = data.start_date !== undefined;
    const hasEnd   = data.end_date   !== undefined;

    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both start_date and end_date must be provided together',
        path: hasStart ? ['end_date'] : ['start_date'],
      });
      return;
    }

    if (hasStart && hasEnd && data.end_date! < data.start_date!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'end_date must be greater than or equal to start_date',
        path: ['end_date'],
      });
    }
  });

export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;
