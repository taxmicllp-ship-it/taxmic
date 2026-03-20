import { prisma } from '@repo/database';
import { invoicesRepository } from './invoices.repository';
import { AppError } from '../../../shared/utils/errors';
import { logger } from '../../../shared/utils/logger';
import { config } from '../../../config';
import { generateInvoicePdf } from './pdf-generator.service';
import { CreateInvoiceDto, UpdateInvoiceDto, ListInvoicesQuery, InvoiceTotals } from './invoices.types';
import { notificationsService, emailService } from '../../notifications/index';

function computeTotals(items: { quantity: string; unit_price: string }[], taxAmount: string): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => {
    return sum + parseFloat(item.quantity) * parseFloat(item.unit_price);
  }, 0);
  const tax = parseFloat(taxAmount ?? '0');
  return {
    subtotal_amount: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(tax * 100) / 100,
    total_amount: Math.round((subtotal + tax) * 100) / 100,
  };
}

class InvoicesService {
  async createInvoice(firmId: string, data: CreateInvoiceDto) {
    const totals = computeTotals(data.items, data.tax_amount ?? '0');
    const number = await invoicesRepository.getNextNumber(firmId);
    const invoice = await invoicesRepository.create(firmId, data, number, totals);
    logger.info({ event: 'INVOICE_CREATED', firmId, resourceId: invoice.id, number });
    return invoice;
  }

  async getInvoice(firmId: string, invoiceId: string) {
    const invoice = await invoicesRepository.findById(firmId, invoiceId);
    if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    return invoice;
  }

  async listInvoices(firmId: string, query: ListInvoicesQuery) {
    return invoicesRepository.findAll(firmId, query);
  }

  async updateInvoice(firmId: string, invoiceId: string, data: UpdateInvoiceDto) {
    const existing = await this.getInvoice(firmId, invoiceId);
    if (existing.status !== 'draft') {
      throw new AppError('Only draft invoices can be updated', 422, 'INVALID_STATUS');
    }

    let totals: InvoiceTotals | undefined;
    if (data.items !== undefined || data.tax_amount !== undefined) {
      const items = data.items ?? existing.invoice_items.map((i) => ({
        quantity: String(i.quantity),
        unit_price: String(i.unit_price),
      }));
      const tax = data.tax_amount ?? String(existing.tax_amount);
      totals = computeTotals(items, tax);
    }

    const invoice = await invoicesRepository.update(firmId, invoiceId, data, totals);
    logger.info({ event: 'INVOICE_UPDATED', firmId, resourceId: invoiceId });
    return invoice;
  }

  async sendInvoice(firmId: string, invoiceId: string, userId: string) {
      const existing = await this.getInvoice(firmId, invoiceId);
      if (existing.status !== 'draft') {
        throw new AppError('Only draft invoices can be sent', 422, 'INVALID_STATUS');
      }

      // Fetch firm + settings for PDF
      const firm = await prisma.firms.findUnique({
        where: { id: firmId },
        include: { firm_settings: true },
      });

      const firmSettings = firm?.firm_settings ?? {};
      const firmName = firm?.name ?? 'Your Firm';

      // Generate PDF and store
      const pdfKey = await generateInvoicePdf(
        existing as any,
        firmSettings,
        firmName
      );

      // Send email via named template
      try {
        await emailService.sendEmail({
          to: (existing as any).client?.email ?? 'client@placeholder.com',
          from: firm?.email ?? config.emailFrom,
          subject: `Invoice #${existing.number} from ${firmName}`,
          templateName: 'invoice',
          firmId,
          templateVars: {
            invoiceNumber: String(existing.number),
            firmName,
            totalAmount: String(existing.total_amount),
            portalUrl: `${config.frontendUrl}/portal/invoices`,
          },
        });
      } catch (err) {
        logger.warn({ event: 'EMAIL_SEND_FAILED', error: err });
      }

      const invoice = await invoicesRepository.updateStatus(firmId, invoiceId, {
        status: 'sent',
        sent_at: new Date(),
        pdf_url: pdfKey,
      });

      // Create in-app notification for the requesting user
      try {
        await notificationsService.createNotification(firmId, {
          user_id: userId,
          type: 'invoice_sent',
          title: `Invoice Sent: #${existing.number}`,
          message: 'Invoice has been sent to the client.',
          entity_type: 'invoice',
          entity_id: invoiceId,
        });
      } catch (err) {
        logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
      }

      logger.info({ event: 'INVOICE_SENT', firmId, resourceId: invoiceId });
      return invoice;
    }

  async listClientInvoices(firmId: string, clientId: string) {
    return invoicesRepository.findByClient(firmId, clientId);
  }

  async markPaid(firmId: string, invoiceId: string, userId: string) {
    const existing = await this.getInvoice(firmId, invoiceId);
    if (existing.status === 'paid') {
      throw new AppError('Invoice is already paid', 422, 'ALREADY_PAID');
    }
    if (existing.status === 'draft') {
      throw new AppError('Draft invoices cannot be marked as paid directly', 422, 'INVALID_STATUS');
    }

    const invoice = await invoicesRepository.updateStatus(firmId, invoiceId, {
      status: 'paid',
      paid_at: new Date(),
      paid_amount: parseFloat(String(existing.total_amount)),
    });

    try {
      await notificationsService.createNotification(firmId, {
        user_id: userId,
        type: 'invoice_paid',
        title: `Invoice Manually Marked Paid: #${existing.number}`,
        message: 'Invoice has been manually recorded as paid.',
        entity_type: 'invoice',
        entity_id: invoiceId,
      });
    } catch (err) {
      logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
    }

    logger.info({ event: 'INVOICE_MARKED_PAID', firmId, resourceId: invoiceId, userId });
    return invoice;
  }

  async deleteInvoice(firmId: string, invoiceId: string) {
    const existing = await this.getInvoice(firmId, invoiceId);
    
    // Only draft invoices can be deleted
    if (existing.status !== 'draft') {
      throw new AppError('Only draft invoices can be deleted', 422, 'INVALID_STATUS');
    }

    // Prevent deletion if payment records exist (any status)
    if (existing.payments && existing.payments.length > 0) {
      throw new AppError('Cannot delete invoice with payment records', 422, 'HAS_PAYMENTS');
    }

    await invoicesRepository.softDelete(firmId, invoiceId);
    logger.info({ event: 'INVOICE_DELETED', firmId, resourceId: invoiceId });
  }
}

export const invoicesService = new InvoicesService();
