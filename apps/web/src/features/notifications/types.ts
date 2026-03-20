export type NotificationType =
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
  type: NotificationType;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsListParams {
  is_read?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationsListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}
