import { emailEventsRepository } from './email-events.repository';
import { CreateEmailEventDto, ListEmailEventsQuery } from './email-events.types';

class EmailEventsService {
  async logEmailEvent(data: CreateEmailEventDto) {
    return emailEventsRepository.create(data);
  }

  async listEmailEvents(firmId: string, query: ListEmailEventsQuery) {
    return emailEventsRepository.findAll(firmId, query);
  }
}

export const emailEventsService = new EmailEventsService();
