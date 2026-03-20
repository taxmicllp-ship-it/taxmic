import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { emailEventsService } from './email-events/email-events.service';
import { ListNotificationsQuerySchema, ListEmailEventsQuerySchema } from './notifications.validation';

export const notificationsController = {
  async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const userId = req.user!.userId;
      const query = ListNotificationsQuerySchema.parse(req.query);
      const result = await notificationsService.listNotifications(firmId, userId, {
        is_read: query.is_read === 'true' ? true : query.is_read === 'false' ? false : undefined,
        page: query.page,
        limit: query.limit,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const notification = await notificationsService.createNotification(firmId, req.body);
      res.status(201).json(notification);
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const userId = req.user!.userId;
      const notification = await notificationsService.markAsRead(firmId, userId, req.params.id);
      res.json(notification);
    } catch (err) {
      next(err);
    }
  },

  async listEmailEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const firmId = req.user!.firmId;
      const query = ListEmailEventsQuerySchema.parse(req.query);
      const result = await emailEventsService.listEmailEvents(firmId, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const firmId = req.user!.firmId;
      const result = await notificationsService.getUnreadCount(userId, firmId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
