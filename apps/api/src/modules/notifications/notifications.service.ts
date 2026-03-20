import { notificationsRepository } from './notifications.repository';
import { CreateNotificationDto, ListNotificationsQuery } from './notifications.types';

class NotificationsService {
  async listNotifications(firmId: string, userId: string, query: ListNotificationsQuery) {
    return notificationsRepository.findAll(firmId, userId, query);
  }

  async createNotification(firmId: string, data: CreateNotificationDto & { user_id: string | null }) {
    if (!data.user_id) return null;
    return notificationsRepository.create(firmId, data);
  }

  async markAsRead(firmId: string, userId: string, notificationId: string) {
    const result = await notificationsRepository.markAsRead(firmId, userId, notificationId);
    if (!result) {
      const err: any = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }
    return result;
  }

  async getUnreadCount(userId: string, firmId: string): Promise<{ unread_count: number }> {
    const unread_count = await notificationsRepository.countUnread(userId, firmId);
    return { unread_count };
  }
}

export const notificationsService = new NotificationsService();
