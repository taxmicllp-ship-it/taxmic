import { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { stripeService } from './stripe.service';
import { paymentsRepository } from './payments.repository';
import { invoicesRepository } from '../invoices/invoices.repository';
import { config } from '../../../config';
import { logger } from '../../../shared/utils/logger';
import { notificationsService } from '../../notifications/index';

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;

  if (!config.stripeWebhookSecret) {
    logger.warn({ event: 'WEBHOOK_SECRET_MISSING' });
    res.status(503).json({ error: 'Stripe webhook not configured' });
    return;
  }

  let event: any;
  try {
    event = stripeService.constructEvent(req.body as Buffer, sig, config.stripeWebhookSecret);
  } catch (err: any) {
    logger.warn({ event: 'WEBHOOK_SIGNATURE_FAILED', error: err.message });
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  // Idempotency check
  const existing = await prisma.webhook_events.findUnique({
    where: { event_id: event.id },
  });
  if (existing?.status === 'processed') {
    res.sendStatus(200);
    return;
  }

  // Record event
  await prisma.webhook_events.upsert({
    where: { event_id: event.id },
    create: {
      event_id: event.id,
      type: event.type,
      status: 'processing',
      payload: event,
      received_at: new Date(),
    },
    update: { status: 'processing' },
  });

  try {
    await handleEvent(event);

    await prisma.webhook_events.update({
      where: { event_id: event.id },
      data: { status: 'processed', processed_at: new Date() },
    });

    res.sendStatus(200);
  } catch (err: any) {
    logger.error({ event: 'WEBHOOK_PROCESSING_ERROR', eventId: event.id, error: err.message });
    await prisma.webhook_events.update({
      where: { event_id: event.id },
      data: { status: 'failed', error: err.message },
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleEvent(event: any): Promise<void> {
  const session = event.data?.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      if (!paymentIntentId) break;

      // Update payment
      await paymentsRepository.updateByStripePaymentIntentId(paymentIntentId, {
        status: 'completed',
        paid_at: new Date(),
        stripe_charge_id: session.payment_intent ?? null,
      });

      // Update invoice
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId) {
        const invoice = await prisma.invoices.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          await invoicesRepository.updateStatus(invoice.firm_id, invoiceId, {
            status: 'paid',
            paid_at: new Date(),
            paid_amount: parseFloat(String(invoice.total_amount)),
          });
          logger.info({ event: 'INVOICE_PAID', invoiceId });

          try {
            const firmUser = await prisma.users.findFirst({
              where: { firm_id: invoice.firm_id, is_active: true, deleted_at: null },
              orderBy: { created_at: 'asc' },
              select: { id: true },
            });
            if (firmUser) {
              await notificationsService.createNotification(invoice.firm_id, {
                user_id: firmUser.id,
                type: 'invoice_paid',
                title: `Invoice Paid: #${invoice.number}`,
                message: 'Payment has been received.',
                entity_type: 'invoice',
                entity_id: invoiceId,
              });
            }
          } catch (err) {
            logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
          }
        }
      }
      break;
    }

    case 'checkout.session.expired': {
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      if (paymentIntentId) {
        await paymentsRepository.updateByStripePaymentIntentId(paymentIntentId, {
          status: 'failed',
        });
      }

      // Send failure email notification
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId) {
        try {
          const invoice = await prisma.invoices.findUnique({
            where: { id: invoiceId },
            include: { client: { select: { email: true, name: true } } },
          });
          if (invoice?.client?.email) {
            const { emailService } = await import('../../notifications/index');
            await emailService.sendEmail({
              to: invoice.client.email,
              subject: `Payment Failed for Invoice #${invoice.number}`,
              body: `Your payment for Invoice #${invoice.number} could not be completed. Please try again.`,
              firmId: invoice.firm_id,
            });
          }
        } catch (err) {
          logger.warn({ event: 'PAYMENT_FAILURE_EMAIL_ERROR', error: err });
        }
      }
      break;
    }

    default:
      logger.info({ event: 'WEBHOOK_UNHANDLED', type: event.type });
  }
}
