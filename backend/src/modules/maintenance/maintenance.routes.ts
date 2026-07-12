import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { uploadMaintenance } from '../../config/multer';
import {
  CreateMaintenanceRequestSchema,
  AssignTechnicianSchema,
  ResolveMaintenanceSchema,
  MaintenanceParamsSchema,
} from './maintenance.schema';
import { paginationSchema } from '../../common/pagination';
import { z } from 'zod';

const router = Router();

// Apply authentication to all maintenance routes
router.use(authenticate);

const ListRequestsQuerySchema = z.object({
  query: paginationSchema,
});

router.get('/', validate(ListRequestsQuerySchema), maintenanceController.listRequests);
router.post(
  '/',
  uploadMaintenance.single('photo'),
  validate(CreateMaintenanceRequestSchema),
  maintenanceController.createRequest
);
router.get('/:id', validate(MaintenanceParamsSchema), maintenanceController.getRequestDetail);

// Manager/Admin only routes
router.use(requireRole(['ADMIN', 'ASSET_MANAGER']));

router.patch('/:id/approve', validate(MaintenanceParamsSchema), maintenanceController.approveRequest);
router.patch('/:id/reject', validate(MaintenanceParamsSchema), maintenanceController.rejectRequest);
router.patch(
  '/:id/assign-technician',
  validate(MaintenanceParamsSchema),
  validate(AssignTechnicianSchema),
  maintenanceController.assignTechnician
);
router.patch('/:id/start', validate(MaintenanceParamsSchema), maintenanceController.startRequest);
router.patch(
  '/:id/resolve',
  validate(MaintenanceParamsSchema),
  validate(ResolveMaintenanceSchema),
  maintenanceController.resolveRequest
);

export default router;
