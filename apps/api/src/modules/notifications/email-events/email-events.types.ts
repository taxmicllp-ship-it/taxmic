export type EmailEventTypeEnum =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

export interface EmailEvent {
  id: string;
  firm_id: string | null;
  message_id: string;
  email_to: string;
  email_from: string;
  subject: string | null;
  template_name: string | null;
  event_type: EmailEventTypeEnum;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateEmailEventDto {
  firmId?: string | null;
  messageId: string;
  emailTo: string;
  emailFrom: string;
  subject?: string;
  templateName?: string;
  eventType: EmailEventTypeEnum;
  eventData?: Record<string, unknown>;
}

export interface ListEmailEventsQuery {
  page: number;
  limit: number;
}

export interface PaginatedEmailEventsResult {
  data: EmailEvent[];
  total: number;
  page: number;
  limit: number;
}
