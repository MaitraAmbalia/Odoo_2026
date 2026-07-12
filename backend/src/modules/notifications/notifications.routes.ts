import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { GetNotificationsQuerySchema, ReadNotificationParamsSchema } from './notifications.schema';

const router = Router();

// Apply authentication middleware to all notifications routes
router.use(authenticate);

router.get('/', validate(GetNotificationsQuerySchema), notificationsController.getMyNotifications);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', validate(ReadNotificationParamsSchema), notificationsController.markAsRead);

export default router;
