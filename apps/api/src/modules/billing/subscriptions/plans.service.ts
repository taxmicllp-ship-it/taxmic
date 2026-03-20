import Stripe from 'stripe';
import { plansRepository } from './plans.repository';
import { AppError } from '../../../shared/utils/errors';
import { config } from '../../../config';

export interface CreatePlanDto {
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_annual: number;
  max_users?: number;
  max_clients?: number;
  max_storage_gb?: number;
  sort_order?: number;
}

export type UpdatePlanDto = Partial<CreatePlanDto>;

function getStripe(): Stripe {
  if (!config.stripeSecretKey) {
    throw new AppError('Stripe is not configured', 502, 'STRIPE_ERROR');
  }
  return new Stripe(config.stripeSecretKey, { apiVersion: '2026-02-25.clover' as any });
}

class PlansService {
  async listPlans() {
    return plansRepository.findAll();
  }

  async getPlan(id: string) {
    const plan = await plansRepository.findById(id);
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND');
    return plan;
  }

  async listAllPlans() {
    return plansRepository.findAll_admin();
  }

  async createPlan(dto: CreatePlanDto) {
    const stripe = getStripe();

    let stripeProduct: Stripe.Product;
    let stripePrice: Stripe.Price;

    try {
      stripeProduct = await stripe.products.create({
        name: dto.name,
        ...(dto.description && { description: dto.description }),
      });
    } catch (err) {
      throw new AppError('Stripe product creation failed', 502, 'STRIPE_ERROR');
    }

    try {
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(dto.price_monthly * 100),
        currency: 'usd',
        recurring: { interval: 'month' },
      });
    } catch (err) {
      throw new AppError('Stripe price creation failed', 502, 'STRIPE_ERROR');
    }

    return plansRepository.create({
      ...dto,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const existing = await plansRepository.findById(id);
    if (!existing) throw new AppError('Plan not found', 404, 'NOT_FOUND');

    const priceChanged =
      (dto.price_monthly !== undefined && Number(dto.price_monthly) !== Number(existing.price_monthly)) ||
      (dto.price_annual !== undefined && Number(dto.price_annual) !== Number(existing.price_annual));

    let newStripePrice: Stripe.Price | undefined;

    if (priceChanged) {
      const stripe = getStripe();
      const priceToUse = dto.price_monthly !== undefined ? dto.price_monthly : Number(existing.price_monthly);

      try {
        newStripePrice = await stripe.prices.create({
          product: existing.stripe_product_id!,
          unit_amount: Math.round(priceToUse * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
        });
      } catch (err) {
        throw new AppError('Stripe price creation failed', 502, 'STRIPE_ERROR');
      }

      if (existing.stripe_price_id) {
        try {
          await stripe.prices.update(existing.stripe_price_id, { active: false });
        } catch (err) {
          throw new AppError('Stripe price archive failed', 502, 'STRIPE_ERROR');
        }
      }
    }

    return plansRepository.update(id, {
      ...dto,
      ...(newStripePrice && { stripe_price_id: newStripePrice.id }),
    });
  }

  async deactivatePlan(id: string) {
    const plan = await plansRepository.findById(id);
    if (!plan) throw new AppError('Plan not found', 404, 'NOT_FOUND');

    if (plan.stripe_price_id) {
      const stripe = getStripe();
      try {
        await stripe.prices.update(plan.stripe_price_id, { active: false });
      } catch (err) {
        throw new AppError('Stripe price deactivation failed', 502, 'STRIPE_ERROR');
      }
    }

    return plansRepository.deactivate(id);
  }
}

export const plansService = new PlansService();
