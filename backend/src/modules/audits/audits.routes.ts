import { Router } from 'express';
import { auditsController } from './audits.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import {
  CreateAuditCycleSchema,
  VerifyAuditItemSchema,
  AuditParamsSchema,
  VerifyItemParamsSchema,
} from './audits.schema';
import { paginationSchema } from '../../common/pagination';
import { z } from 'zod';

const router = Router();

// Apply authentication to all audit endpoints
router.use(authenticate);

const ListCyclesQuerySchema = z.object({
  query: paginationSchema,
});

router.get('/', validate(ListCyclesQuerySchema), auditsController.listCycles);
router.post('/', requireRole(['ADMIN']), validate(CreateAuditCycleSchema), auditsController.createCycle);
router.get('/:id', validate(AuditParamsSchema), auditsController.getCycleDetail);

// Verification endpoint — accessible to assigned auditors and Admins, permissions enforced in service layer
router.patch(
  '/:id/items/:itemId',
  validate(VerifyItemParamsSchema),
  validate(VerifyAuditItemSchema),
  auditsController.verifyItem
);

// Admin / Manager routes
router.use(requireRole(['ADMIN', 'ASSET_MANAGER']));

router.post('/:id/close', validate(AuditParamsSchema), auditsController.closeCycle);
router.get('/:id/discrepancies', validate(AuditParamsSchema), auditsController.listDiscrepancies);

export default router;
