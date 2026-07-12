import { NotificationType } from '@prisma/client';
import { notificationsRepository } from './notifications.repository';
import { emitToUser } from '../../config/socket';
import { ApiError } from '../../common/ApiError';

export class NotificationsService {
  /**
   * Helper function used by other modules to create and send a notification.
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    const notification = await notificationsRepository.createNotification(data);

    // Emit real-time notification to the user's specific room
    try {
      emitToUser(data.userId, 'notification:new', notification);
    } catch (error) {
      // Log the error but do not fail the request/transaction
      console.error(`Failed to emit socket notification to user:${data.userId}:`, error);
    }

    return notification;
  }

  async getMyNotifications(
    userId: string,
    query: { unreadOnly?: boolean; page: number; limit: number }
  ) {
    return notificationsRepository.getUserNotifications(userId, query);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await notificationsRepository.getNotificationById(id);

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ApiError(403, 'You are not authorized to access this notification');
    }

    return notificationsRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return notificationsRepository.markAllAsRead(userId);
  }
}

export const notificationsService = new NotificationsService();
