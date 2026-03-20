import { Request, Response, NextFunction } from 'express';
import { dashboardService, DateRangeFilter } from './dashboard.service';
import { DashboardQuerySchema } from './dashboard.validation';

export const dashboardController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { firmId, userId } = req.user!;

      const parsed = DashboardQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { start_date, end_date } = parsed.data;

      let dateRange: DateRangeFilter | undefined;

      if (start_date && end_date) {
        dateRange = {
          start_date: new Date(start_date + 'T00:00:00.000Z'),
          end_date:   new Date(end_date   + 'T00:00:00.000Z'),
        };
      }

      const data = await dashboardService.getSummary(firmId, userId, dateRange);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },
};
