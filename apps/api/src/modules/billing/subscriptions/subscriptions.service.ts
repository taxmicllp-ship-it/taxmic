import Stripe from 'stripe';
import { prisma } from '@repo/database';
import { config } from '../../../config';
import { AppError } from '../../../shared/utils/errors';
import { logger } from '../../../shared/utils/logger';
import { plansRepository } from './plans.repository';
import { subscriptionsRepository } from './subscriptions.repository';
import type { CreateSubscriptionDto, UpdateSubscriptionDto } from './subscriptions.types';

function getStripe(): Stripe {
  if (!config.stripeSecretKey) throw new AppError('Stripe not configured', 503, 'STRIPE_NOT_CONFIGURED');
  return new Stripe(config.stripeSecretKey, { apiVersion: '2026-02-25.clover' });
}

class SubscriptionsService {
  async createSubscription(firmId: string, dto: CreateSubscriptionDto) {
    const existing = await subscriptionsRepository.findByFirmId(firmId);
    if (existing && existing.status !== 'canceled') {
      throw new AppError('Firm already has an active subscription', 409, 'SUBSCRIPTION_EXISTS');
    }

    const plan = await plansRepository.findById(dto.planId);
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND');

    const stripePriceId = plan.stripe_price_id;
    if (!stripePriceId) throw new AppError('Plan is not yet configured for payments. Contact support.', 422, 'PLAN_MISCONFIGURED');

    const firm = await prisma.firms.findUnique({
      where: { id: firmId },
      select: { email: true, name: true },
    });
    if (!firm) throw new AppError('Firm not found', 404, 'NOT_FOUND');

    const stripe = getStripe();

    const customer = await stripe.customers.create({
      email: firm.email,
      name: firm.name,
      metadata: { firm_id: firmId },
    });

    await stripe.paymentMethods.attach(dto.paymentMethodId, { customer: customer.id });

    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: dto.paymentMethodId },
    });

    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: stripePriceId }],
      expand: ['latest_invoice'],
    });

    const firstItem = stripeSubscription.items.data[0];
    const currentPeriodStart = new Date(firstItem.current_period_start * 1000);
    const currentPeriodEnd = new Date(firstItem.current_period_end * 1000);

    const subscription = await subscriptionsRepository.create({
      firmId,
      planId: dto.planId,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: stripeSubscription.id,
      status: stripeSubscription.status,
      currentPeriodStart,
      currentPeriodEnd,
    });

    await subscriptionsRepository.createEvent({
      subscriptionId: subscription.id,
      eventType: 'subscription.created',
      toStatus: stripeSubscription.status,
    });

    logger.info({ event: 'SUBSCRIPTION_CREATED', firmId, subscriptionId: subscription.id });
    return subscription;
  }

  async getSubscription(firmId: string, subscriptionId: string) {
    const subscription = await subscriptionsRepository.findById(subscriptionId, firmId);
    if (!subscription) throw new AppError('Subscription not found', 404, 'NOT_FOUND');
    return subscription;
  }

  async updateSubscription(firmId: string, subscriptionId: string, dto: UpdateSubscriptionDto) {
    const subscription = await subscriptionsRepository.findById(subscriptionId, firmId);
    if (!subscription) throw new AppError('Subscription not found', 404, 'NOT_FOUND');

    const stripe = getStripe();

    if (dto.planId !== undefined) {
      const plan = await plansRepository.findById(dto.planId);
      if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND');

      const stripePriceId = plan.stripe_price_id;
      if (!stripePriceId) throw new AppError('Plan is not yet configured for payments. Contact support.', 422, 'PLAN_MISCONFIGURED');

      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id!);

      await stripe.subscriptions.update(subscription.stripe_subscription_id!, {
        items: [{ id: stripeSubscription.items.data[0].id, price: stripePriceId }],
        proration_behavior: 'create_prorations',
      });

      await subscriptionsRepository.update(subscriptionId, firmId, { planId: dto.planId });
    }

    if (dto.cancelAtPeriodEnd !== undefined) {
      await stripe.subscriptions.update(subscription.stripe_subscription_id!, {
        cancel_at_period_end: dto.cancelAtPeriodEnd,
      });

      await subscriptionsRepository.update(subscriptionId, firmId, { cancelAtPeriodEnd: dto.cancelAtPeriodEnd });
    }

    await subscriptionsRepository.createEvent({ subscriptionId, eventType: 'subscription.updated' });

    logger.info({ event: 'SUBSCRIPTION_UPDATED', firmId, subscriptionId });
    return subscriptionsRepository.findById(subscriptionId, firmId);
  }

  async getCurrentSubscription(firmId: string) {
    const subscription = await subscriptionsRepository.findByFirmId(firmId);
    if (!subscription) return null;
    return subscription;
  }

  async createCheckoutSession(firmId: string, planId: string) {
    const plan = await plansRepository.findById(planId);
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND');

    const stripePriceId = plan.stripe_price_id;
    if (!stripePriceId) throw new AppError('Plan is not yet configured for payments. Contact support.', 422, 'PLAN_MISCONFIGURED');

    const firm = await prisma.firms.findUnique({
      where: { id: firmId },
      select: { email: true, name: true },
    });
    if (!firm) throw new AppError('Firm not found', 404, 'NOT_FOUND');

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: firm.email,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: { firm_id: firmId, plan_id: planId },
      success_url: `${config.frontendUrl}/billing/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/billing/plans`,
    });

    logger.info({ event: 'CHECKOUT_SESSION_CREATED', firmId, planId, sessionId: session.id });
    return { url: session.url };
  }

  async cancelSubscription(firmId: string, subscriptionId: string) {
    const subscription = await subscriptionsRepository.findById(subscriptionId, firmId);
    if (!subscription) throw new AppError('Subscription not found', 404, 'NOT_FOUND');

    if (subscription.stripe_subscription_id) {
      const stripe = getStripe();
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    }

    const updated = await subscriptionsRepository.update(subscriptionId, firmId, {
      status: 'canceled',
      canceledAt: new Date(),
    });

    await subscriptionsRepository.createEvent({
      subscriptionId,
      eventType: 'subscription.canceled',
      fromStatus: subscription.status,
      toStatus: 'canceled',
    });

    logger.info({ event: 'SUBSCRIPTION_CANCELED', firmId, subscriptionId });
    return updated;
  }
}

export const subscriptionsService = new SubscriptionsService();
