import { invoicesRepository } from '../invoices/invoices.repository';
import { paymentsRepository } from './payments.repository';
import { stripeService } from './stripe.service';
import { AppError } from '../../../shared/utils/errors';
import { logger } from '../../../shared/utils/logger';

class PaymentsService {
  async createCheckoutSession(
    firmId: string,
    invoiceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string }> {
    const invoice = await invoicesRepository.findById(firmId, invoiceId);
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    if (invoice.status !== 'sent') {
      throw new AppError('Only sent invoices can be paid via Stripe', 422, 'INVALID_STATUS');
    }

    // Create pending payment record
    const payment = await paymentsRepository.create(firmId, {
      invoice_id: invoiceId,
      amount: parseFloat(String(invoice.total_amount)),
      method: 'stripe',
    });

    // Create Stripe Checkout session
    const { url, paymentIntentId } = await stripeService.createCheckoutSession(
      invoice as any,
      successUrl,
      cancelUrl
    );

    // Store payment intent ID
    if (paymentIntentId) {
      await paymentsRepository.updateByStripePaymentIntentId(payment.id, {
        status: 'pending',
        stripe_payment_intent_id: paymentIntentId,
      });
    }

    logger.info({ event: 'STRIPE_CHECKOUT_CREATED', firmId, invoiceId, paymentId: payment.id });
    return { url };
  }

  async listPayments(firmId: string) {
    return paymentsRepository.findAll(firmId);
  }

  async listClientPayments(firmId: string, clientId: string) {
    return paymentsRepository.findByClient(firmId, clientId);
  }
}

export const paymentsService = new PaymentsService();
