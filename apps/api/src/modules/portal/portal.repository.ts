import { prisma } from '@repo/database';
import { randomUUID } from 'crypto';

class PortalRepository {
  findClientUserByEmailAndFirmSlug(email: string, firmSlug: string) {
    return prisma.client_users.findFirst({
      where: {
        email,
        deleted_at: null,
        is_active: true,
        client: {
          firm: { slug: firmSlug },
        },
      },
      include: {
        client: { include: { firm: true } },
      },
    });
  }

  async createClientUser(data: {
    clientId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }) {
    const record = await prisma.client_users.create({
      data: {
        id: randomUUID(),
        client_id: data.clientId,
        email: data.email,
        password_hash: data.passwordHash,
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });
    const { password_hash: _, ...rest } = record;
    return rest;
  }

  async updateLastLogin(clientUserId: string): Promise<void> {
    await prisma.client_users.update({
      where: { id: clientUserId },
      data: { last_login_at: new Date() },
    });
  }

  async findOrCreatePortalFolder(firmId: string, clientId: string): Promise<string> {
    const existing = await prisma.folders.findFirst({
      where: {
        firm_id: firmId,
        client_id: clientId,
        name: 'Portal Uploads',
        deleted_at: null,
      },
    });
    if (existing) return existing.id;

    const folder = await prisma.folders.create({
      data: {
        id: randomUUID(),
        firm_id: firmId,
        client_id: clientId,
        name: 'Portal Uploads',
      },
    });
    return folder.id;
  }

  async getDashboardCounts(firmId: string, clientId: string) {
    const [document_count, invoice_count, outstanding_invoice_count, task_count] =
      await Promise.all([
        prisma.documents.count({ where: { firm_id: firmId, client_id: clientId, deleted_at: null } }),
        prisma.invoices.count({ where: { firm_id: firmId, client_id: clientId, deleted_at: null } }),
        prisma.invoices.count({
          where: {
            firm_id: firmId,
            client_id: clientId,
            status: { in: ['sent', 'overdue'] },
            deleted_at: null,
          },
        }),
        prisma.tasks.count({ where: { firm_id: firmId, client_id: clientId, deleted_at: null } }),
      ]);

    return { document_count, invoice_count, outstanding_invoice_count, task_count };
  }
}

export const portalRepository = new PortalRepository();
