import { prisma } from '@repo/database';
import { CreateContactDto, UpdateContactDto, ListContactsQuery } from './contacts.types';

class ContactsRepository {
  async findByFirm(firmId: string, opts: ListContactsQuery) {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;
    const where = { firm_id: firmId, deleted_at: null };
    const [data, total] = await Promise.all([
      prisma.contacts.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.contacts.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(firmId: string, contactId: string) {
    return prisma.contacts.findFirst({
      where: { id: contactId, firm_id: firmId, deleted_at: null },
    });
  }

  async create(firmId: string, data: CreateContactDto) {
    return prisma.contacts.create({
      data: {
        firm_id: firmId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        title: data.title,
        notes: data.notes,
      },
    });
  }

  async update(firmId: string, contactId: string, data: UpdateContactDto) {
    return prisma.contacts.update({
      where: { id: contactId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async delete(firmId: string, contactId: string) {
    await prisma.contacts.delete({ where: { id: contactId } });
  }
}

export const contactsRepository = new ContactsRepository();
