import { Router, Request, Response, NextFunction } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { tenantContext } from '../../shared/middleware/tenant-context';
import { validate } from '../../shared/middleware/validation';
import { CreateNotificationSchema } from './notifications.validation';
import { emailService } from './email/email.service';
import { emailEventsService } from './email-events/email-events.service';
import { logger } from '../../shared/utils/logger';

const router = Router();

// POST /emails/send — internal HTTP endpoint (x-internal-request guard)
// No auth middleware — called server-to-server only
router.post(
  '/emails/send',
  (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-internal-request'] !== 'true') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, subject, html, body, templateName, firmId, from } = req.body;
      if (!to || !subject) {
        res.status(400).json({ error: 'to and subject are required' });
        return;
      }
      const result = await emailService.sendEmail({ to, subject, html, body, templateName, firmId, from });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /emails/webhook — SES/Resend inbound delivery/bounce/complaint events (public, no auth)
router.post(
  '/emails/webhook',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;

      // ── Resend webhook format ──────────────────────────────────────────────
      // Resend sends: { type: 'email.delivered' | 'email.bounced' | ..., data: { email_id, from, to, ... } }
      if (typeof body.type === 'string' && body.type.startsWith('email.')) {
        const resendTypeMap: Record<string, string> = {
          'email.sent': 'sent',
          'email.delivered': 'delivered',
          'email.delivery_delayed': 'sent',
          'email.complained': 'complained',
          'email.bounced': 'bounced',
          'email.opened': 'opened',
          'email.clicked': 'clicked',
        };
        const eventType = resendTypeMap[body.type];
        const data = body.data ?? {};
        const messageId: string = data.email_id ?? data.message_id ?? '';
        const emailTo: string = Array.isArray(data.to) ? data.to[0] : (data.to ?? '');
        const emailFrom: string = data.from ?? '';

        if (eventType && messageId) {
          await emailEventsService.logEmailEvent({
            messageId,
            emailTo,
            emailFrom,
            eventType: eventType as any,
            eventData: body,
          });
          logger.info({ event: 'RESEND_WEBHOOK', type: body.type, messageId });
        }

        res.status(200).json({ received: true });
        return;
      }

      // ── SES/SNS webhook format ─────────────────────────────────────────────
      let sesMessage = body;
      if (body.Type === 'Notification' && body.Message) {
        try { sesMessage = JSON.parse(body.Message); } catch { /* not JSON, use as-is */ }
      }

      const notificationType: string = sesMessage.notificationType ?? sesMessage.eventType ?? '';
      const mail = sesMessage.mail ?? {};
      const messageId: string = mail.messageId ?? body.messageId ?? '';
      const emailTo: string = (mail.destination ?? [])[0] ?? '';
      const emailFrom: string = mail.source ?? '';

      const typeMap: Record<string, string> = {
        Delivery: 'delivered',
        Bounce: 'bounced',
        Complaint: 'complained',
        Open: 'opened',
        Click: 'clicked',
      };

      const eventType = typeMap[notificationType];
      if (eventType && messageId) {
        await emailEventsService.logEmailEvent({
          messageId,
          emailTo,
          emailFrom,
          eventType: eventType as any,
          eventData: sesMessage,
        });
        logger.info({ event: 'SES_WEBHOOK', notificationType, messageId });
      }

      // SNS subscription confirmation
      if (body.Type === 'SubscriptionConfirmation' && body.SubscribeURL) {
        logger.info({ event: 'SNS_SUBSCRIPTION_CONFIRM', url: body.SubscribeURL });
      }

      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

// Notifications — authenticated
router.get('/notifications', authenticate, tenantContext, notificationsController.listNotifications);
router.get('/notifications/unread-count', authenticate, tenantContext, notificationsController.getUnreadCount);
router.post(
  '/notifications',
  authenticate,
  tenantContext,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-internal-request'] !== 'true') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  },
  validate(CreateNotificationSchema),
  notificationsController.createNotification
);
router.patch('/notifications/:id/read', authenticate, tenantContext, notificationsController.markAsRead);

// Email events — authenticated
router.get('/email-events', authenticate, tenantContext, notificationsController.listEmailEvents);

export default router;
