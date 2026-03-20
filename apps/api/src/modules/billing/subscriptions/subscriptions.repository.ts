import { prisma, Prisma } from '@repo/database';

class SubscriptionsRepository {
  async findByFirmId(firmId: string) {
    return prisma.subscriptions.findUnique({
      where: { firm_id: firmId },
      include: { plan: true },
    });
  }

  async findById(id: string, firmId: string) {
    return prisma.subscriptions.findFirst({
      where: { id, firm_id: firmId },
      include: { plan: true },
    });
  }

  async create(data: {
    firmId: string;
    planId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }) {
    return prisma.subscriptions.create({
      data: {
        firm_id: data.firmId,
        plan_id: data.planId,
        stripe_customer_id: data.stripeCustomerId,
        stripe_subscription_id: data.stripeSubscriptionId,
        status: data.status as any,
        current_period_start: data.currentPeriodStart,
        current_period_end: data.currentPeriodEnd,
      },
      include: { plan: true },
    });
  }

  async update(
    id: string,
    firmId: string,
    data: Partial<{
      planId: string;
      status: string;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
      cancelAtPeriodEnd: boolean;
      canceledAt: Date | null;
      stripeSubscriptionId: string;
    }>,
  ) {
    const mapped: Record<string, unknown> = {};
    if (data.planId !== undefined) mapped.plan_id = data.planId;
    if (data.status !== undefined) mapped.status = data.status;
    if (data.currentPeriodStart !== undefined) mapped.current_period_start = data.currentPeriodStart;
    if (data.currentPeriodEnd !== undefined) mapped.current_period_end = data.currentPeriodEnd;
    if (data.cancelAtPeriodEnd !== undefined) mapped.cancel_at_period_end = data.cancelAtPeriodEnd;
    if (data.canceledAt !== undefined) mapped.canceled_at = data.canceledAt;
    if (data.stripeSubscriptionId !== undefined) mapped.stripe_subscription_id = data.stripeSubscriptionId;

    return prisma.subscriptions.update({
      where: { id, firm_id: firmId },
      data: mapped as any,
      include: { plan: true },
    });
  }

  async updateByStripeSubscriptionId(
    stripeSubscriptionId: string,
    data: Partial<{
      status: string;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
      cancelAtPeriodEnd: boolean;
      canceledAt: Date | null;
      planId: string;
    }>,
  ) {
    const mapped: Record<string, unknown> = {};
    if (data.status !== undefined) mapped.status = data.status;
    if (data.currentPeriodStart !== undefined) mapped.current_period_start = data.currentPeriodStart;
    if (data.currentPeriodEnd !== undefined) mapped.current_period_end = data.currentPeriodEnd;
    if (data.cancelAtPeriodEnd !== undefined) mapped.cancel_at_period_end = data.cancelAtPeriodEnd;
    if (data.canceledAt !== undefined) mapped.canceled_at = data.canceledAt;
    if (data.planId !== undefined) mapped.plan_id = data.planId;

    return prisma.subscriptions.updateMany({
      where: { stripe_subscription_id: stripeSubscriptionId },
      data: mapped as any,
    });
  }

  async createEvent(data: {
    subscriptionId: string;
    eventType: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    return prisma.subscription_events.create({
      data: {
        subscription_id: data.subscriptionId,
        event_type: data.eventType,
        from_status: data.fromStatus ?? null,
        to_status: data.toStatus ?? null,
        metadata: (data.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  }

  async listEvents(subscriptionId: string) {
    return prisma.subscription_events.findMany({
      where: { subscription_id: subscriptionId },
      orderBy: { created_at: 'desc' },
    });
  }
}

export const subscriptionsRepository = new SubscriptionsRepository();
