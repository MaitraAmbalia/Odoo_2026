import { Router } from 'express';
import { activityLogsController } from './activity-logs.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { ListActivityLogsQuerySchema } from './activity-logs.schema';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole(['ADMIN']),
  validate(ListActivityLogsQuerySchema),
  activityLogsController.getAll
);

export default router;
