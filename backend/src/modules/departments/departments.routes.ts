import { Router } from 'express';
import { departmentsController } from './departments.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import {
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  UpdateDepartmentStatusSchema,
} from './departments.schema';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole(['ADMIN']),
  validate(CreateDepartmentSchema),
  departmentsController.create
);

router.get(
  '/',
  authenticate,
  departmentsController.getAll
);

router.get(
  '/:id',
  authenticate,
  departmentsController.getById
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  validate(UpdateDepartmentSchema),
  departmentsController.update
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole(['ADMIN']),
  validate(UpdateDepartmentStatusSchema),
  departmentsController.updateStatus
);

export default router;
