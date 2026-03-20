import { contactsRepository } from './contacts.repository';
import { AppError } from '../../../shared/utils/errors';
import { logger } from '../../../shared/utils/logger';
import { CreateContactDto, UpdateContactDto, ListContactsQuery } from './contacts.types';

class ContactsService {
  async listContacts(firmId: string, query: ListContactsQuery) {
    return contactsRepository.findByFirm(firmId, query);
  }

  async getContact(firmId: string, contactId: string) {
    const contact = await contactsRepository.findById(firmId, contactId);
    if (!contact) throw new AppError('Contact not found', 404, 'NOT_FOUND');
    return contact;
  }

  async createContact(firmId: string, data: CreateContactDto) {
    const contact = await contactsRepository.create(firmId, data);
    logger.info({ event: 'CONTACT_CREATED', firmId, resourceId: contact.id });
    return contact;
  }

  async updateContact(firmId: string, contactId: string, data: UpdateContactDto) {
    await this.getContact(firmId, contactId);
    const contact = await contactsRepository.update(firmId, contactId, data);
    logger.info({ event: 'CONTACT_UPDATED', firmId, resourceId: contactId });
    return contact;
  }

  async deleteContact(firmId: string, contactId: string) {
    await this.getContact(firmId, contactId);
    await contactsRepository.delete(firmId, contactId);
    logger.info({ event: 'CONTACT_DELETED', firmId, resourceId: contactId });
  }
}

export const contactsService = new ContactsService();
