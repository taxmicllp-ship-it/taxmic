import { prisma } from '@repo/database';
import { portalRepository } from './portal.repository';
import { passwordService } from '../auth/password.service';
import { jwtStrategy } from '../auth/jwt.strategy';
import { documentsService } from '../documents/documents.service';
import { documentsRepository } from '../documents/documents.repository';
import { invoicesService } from '../billing/invoices/invoices.service';
import { invoicesRepository } from '../billing/invoices/invoices.repository';
import { tasksService } from '../tasks/tasks.service';
import { paymentsService } from '../billing/payments/payments.service';
import { AppError } from '../../shared/utils/errors';
import { logger } from '../../shared/utils/logger';
import { PortalLoginDto, CreatePortalAccountDto, PortalAuthResponse } from './portal.types';

class PortalService {
  async login(dto: PortalLoginDto): Promise<PortalAuthResponse> {
    const user = await portalRepository.findClientUserByEmailAndFirmSlug(dto.email, dto.firmSlug);

    if (!user) {
      logger.warn({ event: 'PORTAL_LOGIN_FAILURE', email: dto.email, firmSlug: dto.firmSlug });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const passwordMatch = await passwordService.compare(dto.password, user.password_hash);
    if (!passwordMatch) {
      logger.warn({ event: 'PORTAL_LOGIN_FAILURE', email: dto.email, firmSlug: dto.firmSlug });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    await portalRepository.updateLastLogin(user.id);

    const token = jwtStrategy.sign({
      clientUserId: user.id,
      clientId: user.client_id,
      firmId: user.client.firm_id,
      email: user.email,
      type: 'portal',
    } as any);

    logger.info({
      event: 'PORTAL_LOGIN_SUCCESS',
      clientUserId: user.id,
      clientId: user.client_id,
      firmId: user.client.firm_id,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        clientId: user.client_id,
        firmId: user.client.firm_id,
      },
    };
  }

  async createAccount(firmId: string, dto: CreatePortalAccountDto, callerUserId?: string) {
    const client = await prisma.clients.findFirst({
      where: { id: dto.clientId, firm_id: firmId, deleted_at: null },
    });
    if (!client) {
      throw new AppError('Client not found', 404, 'NOT_FOUND');
    }

    const passwordHash = await passwordService.hash(dto.password);

    let result: any;
    try {
      result = await portalRepository.createClientUser({
        clientId: dto.clientId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new AppError('A portal account with this email already exists for this client', 409, 'CONFLICT');
      }
      throw err;
    }

    logger.info({
      event: 'PORTAL_ACCOUNT_CREATED',
      clientUserId: result.id,
      clientId: dto.clientId,
      firmId,
      createdByUserId: callerUserId,
    });

    return result;
  }

  async getDashboard(firmId: string, clientId: string) {
    return portalRepository.getDashboardCounts(firmId, clientId);
  }

  async listDocuments(firmId: string, clientId: string) {
    return documentsService.listDocuments(firmId, clientId);
  }

  async downloadDocument(firmId: string, clientId: string, documentId: string) {
    const doc = await documentsRepository.findById(firmId, documentId);
    if (!doc || doc.client_id !== clientId) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }
    return documentsService.getDownloadUrl(firmId, documentId);
  }

  async uploadDocument(
    firmId: string,
    clientId: string,
    callerClientUserId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer }
  ) {
    const folderId = await portalRepository.findOrCreatePortalFolder(firmId, clientId);

    const doc = await documentsService.uploadDocument({
      firmId,
      clientId,
      folderId,
      filename: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      uploadedBy: null as any,
    });

    logger.info({
      event: 'PORTAL_DOCUMENT_UPLOAD',
      clientUserId: callerClientUserId,
      clientId,
      firmId,
      documentId: doc.id,
      filename: file.originalname,
    });

    return doc;
  }

  async listInvoices(firmId: string, clientId: string) {
    return invoicesService.listClientInvoices(firmId, clientId);
  }

  async getInvoiceById(firmId: string, clientId: string, invoiceId: string) {
    const invoice = await invoicesRepository.findById(firmId, invoiceId);
    if (!invoice || invoice.client_id !== clientId) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }
    return {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      subtotal_amount: invoice.subtotal_amount,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      line_items: invoice.invoice_items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      })),
    };
  }

  async payInvoice(
    firmId: string,
    clientId: string,
    invoiceId: string,
    callerClientUserId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const invoice = await invoicesRepository.findById(firmId, invoiceId);
    if (!invoice) {
      throw new AppError('Not found', 404, 'NOT_FOUND');
    }
    if (invoice.client_id !== clientId) {
      throw new AppError('Not found', 404, 'NOT_FOUND');
    }
    if (invoice.status !== 'sent') {
      throw new AppError('Invoice cannot be paid', 422, 'INVALID_STATUS');
    }

    logger.info({
      event: 'PORTAL_INVOICE_PAYMENT_STARTED',
      clientUserId: callerClientUserId,
      clientId,
      firmId,
      invoiceId,
    });

    return paymentsService.createCheckoutSession(firmId, invoiceId, successUrl, cancelUrl);
  }

  async listTasks(firmId: string, clientId: string) {
    return tasksService.listClientTasks(firmId, clientId);
  }
}

export const portalService = new PortalService();
