import { Router } from 'express';
import { employeesController } from './employees.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import {
  UpdateEmployeeSchema,
  PromoteEmployeeSchema,
  ListEmployeesQuerySchema,
} from './employees.schema';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRole(['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']),
  validate(ListEmployeesQuerySchema),
  employeesController.getAll
);

router.get(
  '/:id',
  authenticate,
  employeesController.getById
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  validate(UpdateEmployeeSchema),
  employeesController.update
);

router.patch(
  '/:id/promote',
  authenticate,
  requireRole(['ADMIN']),
  validate(PromoteEmployeeSchema),
  employeesController.promote
);

export default router;
