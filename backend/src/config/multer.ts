import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from './env';

// Ensure upload directories exist
const assetUploadDir = path.join(env.UPLOAD_DIR, 'assets');
const maintenanceUploadDir = path.join(env.UPLOAD_DIR, 'maintenance');

[assetUploadDir, maintenanceUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for asset files (photos, invoices, manuals)
const assetStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, assetUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Storage for maintenance photos
const maintenanceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, maintenanceUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (ext || mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed'));
  }
};

export const uploadAsset = multer({
  storage: assetStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadMaintenance = multer({
  storage: maintenanceStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
