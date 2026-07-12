import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { notificationsService } from './notifications.service';

export class NotificationsController {
  getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { page, limit, unreadOnly } = req.query as any;

    const { items, total } = await notificationsService.getMyNotifications(userId, {
      unreadOnly,
      page,
      limit,
    });

    ApiResponse.paginated(res, items, total, page, limit);
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const notification = await notificationsService.markAsRead(id, userId);
    ApiResponse.success(res, notification, 'Notification marked as read');
  });

  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await notificationsService.markAllAsRead(userId);
    ApiResponse.success(res, null, 'All notifications marked as read');
  });
}

export const notificationsController = new NotificationsController();
