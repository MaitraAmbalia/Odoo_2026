import { NotificationType } from '@prisma/client';
import prisma from '../../config/prisma';

export class NotificationsRepository {
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        message: data.message,
        relatedEntityType: data.relatedEntityType || null,
        relatedEntityId: data.relatedEntityId || null,
      },
    });
  }

  async getUserNotifications(
    userId: string,
    params: { unreadOnly?: boolean; page: number; limit: number }
  ) {
    const { unreadOnly, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: any = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, total };
  }

  async getNotificationById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
