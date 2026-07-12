import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import departmentRoutes from '../modules/departments/departments.routes';
import categoriesRoutes from '../modules/categories/categories.routes';
import notificationRoutes from '../modules/notifications/notifications.routes';
import allocationRoutes from '../modules/allocations/allocations.routes';
import transferRoutes from '../modules/allocations/transfers.routes';
import bookingRoutes from '../modules/bookings/bookings.routes';
import maintenanceRoutes from '../modules/maintenance/maintenance.routes';
import assetsRoutes from '../modules/assets/assets.routes';

import employeesRoutes from '../modules/employees/employees.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/categories', categoriesRoutes);
router.use('/notifications', notificationRoutes);
router.use('/employees', employeesRoutes);
router.use('/assets', assetsRoutes);

// Module routes will be mounted here as they are implemented:
router.use('/allocations',   allocationRoutes);
router.use('/transfers',     transferRoutes);
router.use('/bookings',      bookingRoutes);
router.use('/maintenance',   maintenanceRoutes);
// router.use('/audits',        auditRoutes);
// router.use('/activity-logs', activityLogRoutes);
// router.use('/dashboard',     dashboardRoutes);
// router.use('/reports',       reportRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

export default router;
