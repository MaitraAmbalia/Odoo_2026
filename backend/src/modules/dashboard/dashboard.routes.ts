import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.get('/kpis', authenticate, dashboardController.getKpis);
router.get('/overdue', authenticate, dashboardController.getOverdue);
router.get('/recent-activity', authenticate, dashboardController.getRecentActivity);

export default router;
