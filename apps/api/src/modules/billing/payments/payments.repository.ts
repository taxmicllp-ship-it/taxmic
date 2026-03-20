import { prisma } from '@repo/database';
import { CreatePaymentDto, PaymentStatusPatch } from './payments.types';

class PaymentsRepository {
  async create(firmId: string, data: CreatePaymentDto) {
    return prisma.payments.create({
      data: {
        firm_id: firmId,
        invoice_id: data.invoice_id,
        amount: data.amount,
        method: data.method as any,
        status: 'pending',
        stripe_payment_intent_id: data.stripe_payment_intent_id ?? null,
        reference_number: data.reference_number ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async updateByStripePaymentIntentId(intentId: string, patch: PaymentStatusPatch) {
    return prisma.payments.updateMany({
      where: { stripe_payment_intent_id: intentId },
      data: patch as any,
    });
  }

  async findAll(firmId: string) {
    return prisma.payments.findMany({
      where: { firm_id: firmId },
      orderBy: { created_at: 'desc' },
      include: { invoice: { select: { number: true, client_id: true } } },
    });
  }

  async findByClient(firmId: string, clientId: string) {
    return prisma.payments.findMany({
      where: {
        firm_id: firmId,
        invoice: { client_id: clientId },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByInvoice(firmId: string, invoiceId: string) {
    return prisma.payments.findMany({
      where: { firm_id: firmId, invoice_id: invoiceId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findPendingByInvoice(invoiceId: string) {
    return prisma.payments.findFirst({
      where: { invoice_id: invoiceId, status: 'pending', method: 'stripe' },
    });
  }
}

export const paymentsRepository = new PaymentsRepository();
