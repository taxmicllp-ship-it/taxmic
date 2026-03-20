import { prisma } from '@repo/database';
import { CreateClientDto, UpdateClientDto, UpdateFirmDto, ListClientsQuery, PaginatedResult } from './clients.types';

class ClientsRepository {
  async findByFirm(firmId: string, opts: ListClientsQuery): Promise<PaginatedResult<any>> {
    const { search, page, limit } = opts;
    const skip = (page - 1) * limit;

    const where: any = {
      firm_id: firmId,
      deleted_at: null,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.clients.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.clients.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(firmId: string, clientId: string) {
    return prisma.clients.findFirst({
      where: { id: clientId, firm_id: firmId, deleted_at: null },
    });
  }

  async create(firmId: string, data: CreateClientDto) {
    return prisma.clients.create({
      data: {
        firm_id: firmId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        type: data.type as any,
        status: (data.status as any) ?? 'active',
        tax_id: data.taxId,
        website: data.website,
        notes: data.notes,
      },
    });
  }

  async update(firmId: string, clientId: string, data: UpdateClientDto) {
    return prisma.clients.update({
      where: { id: clientId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.type !== undefined && { type: data.type as any }),
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.taxId !== undefined && { tax_id: data.taxId }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async softDelete(firmId: string, clientId: string) {
    await prisma.clients.update({
      where: { id: clientId },
      data: { deleted_at: new Date() },
    });
  }

  async linkContact(firmId: string, clientId: string, contactId: string) {
    return prisma.client_contacts.create({
      data: { firm_id: firmId, client_id: clientId, contact_id: contactId },
    });
  }

  async unlinkContact(firmId: string, clientId: string, contactId: string) {
    await prisma.client_contacts.deleteMany({
      where: { firm_id: firmId, client_id: clientId, contact_id: contactId },
    });
  }

  async findLink(firmId: string, clientId: string, contactId: string) {
    return prisma.client_contacts.findFirst({
      where: { firm_id: firmId, client_id: clientId, contact_id: contactId },
    });
  }

  async findFirmById(firmId: string) {
    return prisma.firms.findFirst({ where: { id: firmId, deleted_at: null } });
  }

  async updateFirm(firmId: string, data: UpdateFirmDto) {
    return prisma.firms.update({
      where: { id: firmId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
      },
    });
  }
}

export const clientsRepository = new ClientsRepository();
