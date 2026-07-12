import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { CreateCategorySchema, UpdateCategorySchema } from './categories.schema';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole(['ADMIN']),
  validate(CreateCategorySchema),
  categoriesController.create
);

router.get(
  '/',
  authenticate,
  categoriesController.getAll
);

router.get(
  '/:id',
  authenticate,
  categoriesController.getById
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  validate(UpdateCategorySchema),
  categoriesController.update
);

router.delete(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  categoriesController.delete
);

export default router;
