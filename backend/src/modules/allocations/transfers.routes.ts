import { Router } from 'express';
import { allocationsController } from './allocations.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import {
  ResolveTransferRequestSchema,
  TransferParamsSchema,
} from './allocations.schema';
import { paginationSchema } from '../../common/pagination';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const QuerySchema = z.object({ query: paginationSchema });

router.get('/', validate(QuerySchema), allocationsController.getTransferRequests);
router.patch('/:id/approve', requireRole(['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']), validate(TransferParamsSchema), validate(ResolveTransferRequestSchema), allocationsController.approveTransferRequest);
router.patch('/:id/reject', requireRole(['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']), validate(TransferParamsSchema), validate(ResolveTransferRequestSchema), allocationsController.rejectTransferRequest);

export default router;
