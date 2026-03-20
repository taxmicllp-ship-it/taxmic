import { prisma } from '@repo/database';

export interface CreatePlanData {
  name: string;
  slug: string;
  description?: string;
  price_monthly: number | string;
  price_annual: number | string;
  max_users?: number | null;
  max_clients?: number | null;
  max_storage_gb?: number | null;
  sort_order?: number;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  is_active?: boolean;
}

export type UpdatePlanData = Partial<CreatePlanData>;

export interface UpsertPlanData {
  name?: string;
  slug?: string;
  description?: string | null;
  price_monthly?: number | string;
  price_annual?: number | string;
  max_users?: number | null;
  max_clients?: number | null;
  max_storage_gb?: number | null;
  sort_order?: number | null;
  stripe_price_id?: string | null;
  is_active?: boolean;
}

class PlansRepository {
  async findAll() {
    return prisma.plans.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.plans.findUnique({
      where: { id },
    });
  }

  async findAll_admin() {
    return prisma.plans.findMany({
      orderBy: { sort_order: 'asc' },
    });
  }

  async create(data: CreatePlanData) {
    return prisma.plans.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price_monthly: data.price_monthly,
        price_annual: data.price_annual,
        max_users: data.max_users ?? null,
        max_clients: data.max_clients ?? null,
        max_storage_gb: data.max_storage_gb ?? null,
        sort_order: data.sort_order ?? 0,
        stripe_product_id: data.stripe_product_id ?? null,
        stripe_price_id: data.stripe_price_id ?? null,
        is_active: data.is_active ?? true,
      },
    });
  }

  async update(id: string, data: UpdatePlanData) {
    return prisma.plans.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price_monthly !== undefined && { price_monthly: data.price_monthly }),
        ...(data.price_annual !== undefined && { price_annual: data.price_annual }),
        ...(data.max_users !== undefined && { max_users: data.max_users }),
        ...(data.max_clients !== undefined && { max_clients: data.max_clients }),
        ...(data.max_storage_gb !== undefined && { max_storage_gb: data.max_storage_gb }),
        ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
        ...(data.stripe_product_id !== undefined && { stripe_product_id: data.stripe_product_id }),
        ...(data.stripe_price_id !== undefined && { stripe_price_id: data.stripe_price_id }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });
  }

  async deactivate(id: string) {
    return prisma.plans.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async findByStripeProductId(stripeProductId: string) {
    return prisma.plans.findFirst({
      where: { stripe_product_id: stripeProductId },
    });
  }

  async upsertByStripeProductId(stripeProductId: string, data: UpsertPlanData) {
    const existing = await prisma.plans.findFirst({
      where: { stripe_product_id: stripeProductId },
    });

    if (existing) {
      return prisma.plans.update({
        where: { id: existing.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.price_monthly !== undefined && { price_monthly: data.price_monthly }),
          ...(data.price_annual !== undefined && { price_annual: data.price_annual }),
          ...(data.max_users !== undefined && { max_users: data.max_users }),
          ...(data.max_clients !== undefined && { max_clients: data.max_clients }),
          ...(data.max_storage_gb !== undefined && { max_storage_gb: data.max_storage_gb }),
          ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
          ...(data.stripe_price_id !== undefined && { stripe_price_id: data.stripe_price_id }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
        },
      });
    }

    return prisma.plans.create({
      data: {
        stripe_product_id: stripeProductId,
        name: data.name ?? stripeProductId,
        slug: data.slug ?? stripeProductId,
        description: data.description ?? null,
        price_monthly: data.price_monthly ?? 0,
        price_annual: data.price_annual ?? 0,
        max_users: data.max_users ?? null,
        max_clients: data.max_clients ?? null,
        max_storage_gb: data.max_storage_gb ?? null,
        sort_order: data.sort_order ?? 0,
        stripe_price_id: data.stripe_price_id ?? null,
        is_active: data.is_active ?? true,
      },
    });
  }
}

export const plansRepository = new PlansRepository();
