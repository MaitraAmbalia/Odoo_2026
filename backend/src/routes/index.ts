import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import notificationRoutes from '../modules/notifications/notifications.routes';
import allocationRoutes from '../modules/allocations/allocations.routes';
import transferRoutes from '../modules/allocations/transfers.routes';

const router = Router();

router.use('/auth', authRoutes);

// Module routes will be mounted here as they are implemented:
// router.use('/departments',   departmentRoutes);
// router.use('/categories',    categoryRoutes);
// router.use('/employees',     employeeRoutes);
// router.use('/assets',        assetRoutes);
router.use('/allocations',   allocationRoutes);
router.use('/transfers',     transferRoutes);
// router.use('/bookings',      bookingRoutes);
// router.use('/maintenance',   maintenanceRoutes);
// router.use('/audits',        auditRoutes);
router.use('/notifications', notificationRoutes);
// router.use('/activity-logs', activityLogRoutes);
// router.use('/dashboard',     dashboardRoutes);
// router.use('/reports',       reportRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

export default router;
