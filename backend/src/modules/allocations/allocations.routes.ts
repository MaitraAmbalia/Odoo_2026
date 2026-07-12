import { Router } from 'express';
import { allocationsController } from './allocations.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import {
  CreateAllocationSchema,
  ReturnAllocationSchema,
  CreateTransferRequestSchema,
  AllocationParamsSchema,
} from './allocations.schema';
import { paginationSchema } from '../../common/pagination';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const QuerySchema = z.object({ query: paginationSchema });

router.get('/', validate(QuerySchema), allocationsController.getAllocations);
router.post('/', requireRole(['ADMIN', 'ASSET_MANAGER']), validate(CreateAllocationSchema), allocationsController.createAllocation);
router.post('/:id/return', validate(AllocationParamsSchema), validate(ReturnAllocationSchema), allocationsController.returnAllocation);
router.post('/:id/transfer-request', validate(AllocationParamsSchema), validate(CreateTransferRequestSchema), allocationsController.createTransferRequest);

export default router;
