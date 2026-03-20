export type NotificationTypeEnum =
  | 'task_assigned'
  | 'task_completed'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'document_uploaded'
  | 'comment_added'
  | 'user_invited';

export interface Notification {
  id: string;
  firm_id: string;
  user_id: string;
  type: NotificationTypeEnum;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface CreateNotificationDto {
  user_id: string;
  type: NotificationTypeEnum;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
}

export interface ListNotificationsQuery {
  is_read?: boolean;
  page: number;
  limit: number;
}

export interface PaginatedNotificationsResult {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}
