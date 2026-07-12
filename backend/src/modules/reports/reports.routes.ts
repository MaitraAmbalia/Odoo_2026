import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { ExportReportSchema } from './reports.schema';

const router = Router();

// Apply authentication and role check to all reports routes
router.use(authenticate);
router.use(requireRole(['ADMIN', 'ASSET_MANAGER']));

router.get('/utilization', reportsController.getUtilization);
router.get('/maintenance-frequency', reportsController.getMaintenanceFrequency);
router.get('/due-for-maintenance', reportsController.getDueForMaintenance);
router.get('/department-allocation-summary', reportsController.getDepartmentAllocationSummary);
router.get('/booking-heatmap', reportsController.getBookingHeatmap);
router.get('/export', validate(ExportReportSchema), reportsController.exportReport);

export default router;
