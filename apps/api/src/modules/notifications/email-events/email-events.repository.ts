import { prisma } from '@repo/database';
import { CreateEmailEventDto, EmailEvent, ListEmailEventsQuery, PaginatedEmailEventsResult } from './email-events.types';

class EmailEventsRepository {
  async create(data: CreateEmailEventDto): Promise<EmailEvent> {
    const record = await prisma.email_events.create({
      data: {
        firm_id: data.firmId ?? null,
        message_id: data.messageId,
        email_to: data.emailTo,
        email_from: data.emailFrom,
        subject: data.subject ?? null,
        template_name: data.templateName ?? null,
        event_type: data.eventType as any,
        event_data: (data.eventData ?? null) as any,
      },
    });

    return {
      id: record.id,
      firm_id: record.firm_id,
      message_id: record.message_id,
      email_to: record.email_to,
      email_from: record.email_from,
      subject: record.subject,
      template_name: record.template_name,
      event_type: record.event_type as any,
      event_data: record.event_data as Record<string, unknown> | null,
      created_at: record.created_at.toISOString(),
    };
  }

  async findAll(firmId: string, query: ListEmailEventsQuery): Promise<PaginatedEmailEventsResult> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where = { firm_id: firmId };

    const [data, total] = await Promise.all([
      prisma.email_events.findMany({ where, skip, take: limit, orderBy: { created_at: 'desc' } }),
      prisma.email_events.count({ where }),
    ]);

    return {
      data: data.map((e) => ({
        id: e.id,
        firm_id: e.firm_id,
        message_id: e.message_id,
        email_to: e.email_to,
        email_from: e.email_from,
        subject: e.subject,
        template_name: e.template_name,
        event_type: e.event_type as any,
        event_data: e.event_data as Record<string, unknown> | null,
        created_at: e.created_at.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }
}

export const emailEventsRepository = new EmailEventsRepository();
