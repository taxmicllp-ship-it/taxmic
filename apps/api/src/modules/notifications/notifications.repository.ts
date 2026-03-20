import { prisma } from '@repo/database';
import {
  CreateNotificationDto,
  ListNotificationsQuery,
  PaginatedNotificationsResult,
  Notification,
} from './notifications.types';

class NotificationsRepository {
  async create(firmId: string, data: CreateNotificationDto & { user_id: string | null }): Promise<Notification | null> {
    if (data.user_id == null) {
      return null;
    }

    const existing = await prisma.notifications.findFirst({
      where: {
        firm_id: firmId,
        user_id: data.user_id,
        type: data.type,
        entity_id: data.entity_id ?? null,
      },
    });

    if (existing) {
      return existing as unknown as Notification;
    }

    const created = await prisma.notifications.create({
      data: {
        firm_id: firmId,
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        entity_type: data.entity_type ?? null,
        entity_id: data.entity_id ?? null,
      },
    });

    return created as unknown as Notification;
  }

  async findAll(firmId: string, userId: string, query: ListNotificationsQuery): Promise<PaginatedNotificationsResult> {
    const { is_read, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { firm_id: firmId, user_id: userId };

    if (is_read !== undefined) {
      // query.is_read may arrive as string 'true'/'false' from validation layer
      where.is_read = typeof is_read === 'string' ? is_read === 'true' : is_read;
    }

    const [data, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.notifications.count({ where }),
    ]);

    return { data: data as unknown as Notification[], total, page, limit };
  }

  async findById(firmId: string, notificationId: string): Promise<Notification | null> {
    const record = await prisma.notifications.findFirst({
      where: { id: notificationId, firm_id: firmId },
    });

    return record as unknown as Notification | null;
  }

  async markAsRead(firmId: string, userId: string, notificationId: string): Promise<Notification | null> {
    const record = await prisma.notifications.updateMany({
      where: { id: notificationId, firm_id: firmId, user_id: userId },
      data: { is_read: true, read_at: new Date() },
    });

    if (record.count === 0) {
      return null;
    }

    return this.findById(firmId, notificationId);
  }

  async countUnread(userId: string, firmId: string): Promise<number> {
    return prisma.notifications.count({
      where: { user_id: userId, firm_id: firmId, is_read: false },
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
