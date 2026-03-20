import { clientsRepository } from './clients.repository';
import { contactsRepository } from '../contacts/contacts.repository';
import { usageService } from '../../billing/subscriptions/usage.service';
import { AppError } from '../../../shared/utils/errors';
import { logger } from '../../../shared/utils/logger';
import { CreateClientDto, UpdateClientDto, UpdateFirmDto, ListClientsQuery } from './clients.types';

class ClientsService {
  async getFirm(firmId: string) {
    const firm = await clientsRepository.findFirmById(firmId);
    if (!firm) throw new AppError('Firm not found', 404, 'NOT_FOUND');
    return firm;
  }

  async updateFirm(firmId: string, data: UpdateFirmDto) {
    await this.getFirm(firmId);
    const firm = await clientsRepository.updateFirm(firmId, data);
    logger.info({ event: 'FIRM_UPDATED', firmId });
    return firm;
  }

  async listClients(firmId: string, query: ListClientsQuery) {
    return clientsRepository.findByFirm(firmId, query);
  }

  async getClient(firmId: string, clientId: string) {
    const client = await clientsRepository.findById(firmId, clientId);
    if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
    return client;
  }

  async createClient(firmId: string, data: CreateClientDto) {
    await usageService.checkClientLimit(firmId);
    const client = await clientsRepository.create(firmId, data);
    logger.info({ event: 'CLIENT_CREATED', firmId, resourceId: client.id });
    return client;
  }

  async updateClient(firmId: string, clientId: string, data: UpdateClientDto) {
    await this.getClient(firmId, clientId);
    const client = await clientsRepository.update(firmId, clientId, data);
    logger.info({ event: 'CLIENT_UPDATED', firmId, resourceId: clientId });
    return client;
  }

  async deleteClient(firmId: string, clientId: string) {
    await this.getClient(firmId, clientId);
    await clientsRepository.softDelete(firmId, clientId);
    logger.info({ event: 'CLIENT_DELETED', firmId, resourceId: clientId });
  }

  async linkContact(firmId: string, clientId: string, contactId: string) {
    await this.getClient(firmId, clientId);

    const contact = await contactsRepository.findById(firmId, contactId);
    if (!contact) throw new AppError('Contact not found', 404, 'NOT_FOUND');

    const existing = await clientsRepository.findLink(firmId, clientId, contactId);
    if (existing) throw new AppError('Contact already linked to this client', 409, 'CONFLICT');

    const link = await clientsRepository.linkContact(firmId, clientId, contactId);
    logger.info({ event: 'CONTACT_LINKED', firmId, resourceId: clientId, contactId });
    return link;
  }

  async unlinkContact(firmId: string, clientId: string, contactId: string) {
    await this.getClient(firmId, clientId);

    const existing = await clientsRepository.findLink(firmId, clientId, contactId);
    if (!existing) throw new AppError('Link not found', 404, 'NOT_FOUND');

    await clientsRepository.unlinkContact(firmId, clientId, contactId);
    logger.info({ event: 'CONTACT_UNLINKED', firmId, resourceId: clientId, contactId });
  }
}

export const clientsService = new ClientsService();
