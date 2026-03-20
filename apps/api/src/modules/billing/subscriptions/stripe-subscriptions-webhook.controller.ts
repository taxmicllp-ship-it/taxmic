import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '@repo/database';
import { config } from '../../../config';
import { logger } from '../../../shared/utils/logger';
import { subscriptionsRepository } from './subscriptions.repository';
import { plansRepository } from './plans.repository';

function getStripe(): Stripe {
  if (!config.stripeSecretKey) throw new Error('Stripe not configured');
  return new Stripe(config.stripeSecretKey, { apiVersion: '2026-02-25.clover' as any });
}

export async function stripeSubscriptionsWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;

  if (!config.stripeWebhookSecret) {
    logger.warn({ event: 'SUBSCRIPTIONS_WEBHOOK_SECRET_MISSING' });
    res.status(503).json({ error: 'Stripe webhook not configured' });
    return;
  }

  let event: any;
  try {
    event = new Stripe(config.stripeSecretKey ?? '', { apiVersion: '2026-02-25.clover' as any })
      .webhooks.constructEvent(req.body as Buffer, sig, config.stripeWebhookSecret);
  } catch (err: any) {
    logger.warn({ event: 'SUBSCRIPTIONS_WEBHOOK_SIGNATURE_FAILED', error: err.message });
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
    await handleSubscriptionEvent(event);

    await prisma.webhook_events.update({
      where: { event_id: event.id },
      data: { status: 'processed', processed_at: new Date() },
    });

    res.sendStatus(200);
  } catch (err: any) {
    logger.error({ event: 'SUBSCRIPTIONS_WEBHOOK_PROCESSING_ERROR', eventId: event.id, error: err.message });
    await prisma.webhook_events.update({
      where: { event_id: event.id },
      data: { status: 'failed', error: err.message },
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

function parseMeta(val: string | undefined): number | null {
  const n = Number(val);
  return isNaN(n) || val === undefined ? null : n;
}

export async function handleSubscriptionEvent(event: any): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created': {
      const sub = event.data.object;
      await subscriptionsRepository.updateByStripeSubscriptionId(sub.id, {
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      });
      const subscription = await prisma.subscriptions.findFirst({
        where: { stripe_subscription_id: sub.id },
      });
      if (subscription) {
        await subscriptionsRepository.createEvent({
          subscriptionId: subscription.id,
          eventType: event.type,
          toStatus: sub.status,
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await subscriptionsRepository.updateByStripeSubscriptionId(sub.id, {
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
      const subscription = await prisma.subscriptions.findFirst({
        where: { stripe_subscription_id: sub.id },
      });
      if (subscription) {
        await subscriptionsRepository.createEvent({
          subscriptionId: subscription.id,
          eventType: event.type,
          fromStatus: event.data.previous_attributes?.status ?? null,
          toStatus: sub.status,
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await subscriptionsRepository.updateByStripeSubscriptionId(sub.id, {
        status: 'canceled',
        canceledAt: new Date(),
      });
      const subscription = await prisma.subscriptions.findFirst({
        where: { stripe_subscription_id: sub.id },
      });
      if (subscription) {
        await subscriptionsRepository.createEvent({
          subscriptionId: subscription.id,
          eventType: event.type,
          fromStatus: event.data.previous_attributes?.status ?? null,
          toStatus: 'canceled',
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const stripeSubId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;
      if (stripeSubId) {
        await subscriptionsRepository.updateByStripeSubscriptionId(stripeSubId, {
          status: 'past_due',
        });
        const subscription = await prisma.subscriptions.findFirst({
          where: { stripe_subscription_id: stripeSubId },
        });
        if (subscription) {
          await subscriptionsRepository.createEvent({
            subscriptionId: subscription.id,
            eventType: event.type,
            toStatus: 'past_due',
          });
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const stripeSubId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;
      if (stripeSubId) {
        await subscriptionsRepository.updateByStripeSubscriptionId(stripeSubId, {
          status: 'active',
        });
        const subscription = await prisma.subscriptions.findFirst({
          where: { stripe_subscription_id: stripeSubId },
        });
        if (subscription) {
          await subscriptionsRepository.createEvent({
            subscriptionId: subscription.id,
            eventType: event.type,
            toStatus: 'active',
          });
        }
      }
      break;
    }

    case 'product.created':
    case 'product.updated': {
      const product = event.data.object;
      await plansRepository.upsertByStripeProductId(product.id, {
        name: product.name,
        description: product.description ?? null,
        slug: product.metadata?.slug ?? product.id,
        max_users: parseMeta(product.metadata?.max_users),
        max_clients: parseMeta(product.metadata?.max_clients),
        max_storage_gb: parseMeta(product.metadata?.max_storage_gb),
        sort_order: parseMeta(product.metadata?.sort_order),
      });
      break;
    }

    case 'price.created': {
      const price = event.data.object;
      const productId = typeof price.product === 'string' ? price.product : price.product?.id;
      const plan = await plansRepository.findByStripeProductId(productId);
      if (!plan) {
        logger.warn({ event: 'WEBHOOK_PRICE_CREATED_PLAN_NOT_FOUND', productId });
        break;
      }
      await plansRepository.update(plan.id, {
        stripe_price_id: price.id,
        price_monthly: price.unit_amount / 100,
      });
      break;
    }

    case 'price.updated': {
      const price = event.data.object;
      const productId = typeof price.product === 'string' ? price.product : price.product?.id;
      const plan = await plansRepository.findByStripeProductId(productId);
      if (!plan) {
        logger.warn({ event: 'WEBHOOK_PRICE_UPDATED_PLAN_NOT_FOUND', productId });
        break;
      }
      if (price.active === false) {
        await plansRepository.update(plan.id, { is_active: false });
      }
      break;
    }

    default:
      logger.info({ event: 'WEBHOOK_UNHANDLED', type: event.type });
  }
}
