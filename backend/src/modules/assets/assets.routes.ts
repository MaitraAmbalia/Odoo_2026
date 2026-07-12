import { Router } from 'express';
import { assetsController } from './assets.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { uploadAsset } from '../../config/multer';
import {
  CreateAssetSchema,
  UpdateAssetSchema,
  UpdateAssetStatusSchema,
  ListAssetsQuerySchema,
} from './assets.schema';

const router = Router();

// Multer parsing fields configuration
const assetUploadFields = uploadAsset.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

router.get(
  '/',
  authenticate,
  validate(ListAssetsQuerySchema),
  assetsController.getAll
);

router.get(
  '/:id',
  authenticate,
  assetsController.getById
);

router.get(
  '/:id/history',
  authenticate,
  assetsController.getHistory
);

router.post(
  '/',
  authenticate,
  requireRole(['ADMIN', 'ASSET_MANAGER']),
  assetUploadFields,
  validate(CreateAssetSchema),
  assetsController.create
);

router.patch(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'ASSET_MANAGER']),
  assetUploadFields,
  validate(UpdateAssetSchema),
  assetsController.update
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole(['ADMIN', 'ASSET_MANAGER']),
  validate(UpdateAssetStatusSchema),
  assetsController.updateStatus
);

router.get(
  '/:id/qrcode',
  authenticate,
  assetsController.getQrCode
);

export default router;
