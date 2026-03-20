import Stripe from 'stripe';
import { config } from '../../../config';
import { AppError } from '../../../shared/utils/errors';
import { withRetry } from '../../../shared/utils/retry';

function getStripeClient(): Stripe {
  if (!config.stripeSecretKey) {
    throw new AppError('Stripe is not configured', 503, 'STRIPE_NOT_CONFIGURED');
  }
  return new Stripe(config.stripeSecretKey, { apiVersion: '2026-02-25.clover' });
}

class StripeService {
  async createCheckoutSession(
    invoice: { id: string; total_amount: number | string; number: number },
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string; paymentIntentId: string | null }> {
    const stripe = getStripeClient();

    const totalCents = Math.round(parseFloat(String(invoice.total_amount)) * 100);

    const session = await withRetry(
      () => stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: totalCents,
              product_data: {
                name: `Invoice #${invoice.number}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { invoice_id: invoice.id },
      }),
      { label: 'stripe.createCheckoutSession', attempts: 3 }
    );

    return {
      url: session.url!,
      paymentIntentId: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    };
  }

  constructEvent(rawBody: Buffer, signature: string, secret: string): Stripe.Event {
    const stripe = new Stripe(config.stripeSecretKey ?? '', { apiVersion: '2026-02-25.clover' });
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
}

export const stripeService = new StripeService();
