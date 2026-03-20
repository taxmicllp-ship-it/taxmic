import api from '../../../lib/api';
import { Notification, NotificationsListParams, NotificationsListResponse } from '../types';

export const notificationsApi = {
  list: (params?: NotificationsListParams) =>
    api.get<NotificationsListResponse>('/notifications', { params }).then((r) => r.data),

  markAsRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
};
