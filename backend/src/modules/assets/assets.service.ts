import path from 'path';
import QRCode from 'qrcode';
import { ApiError } from '../../common/ApiError';
import { assetsRepository } from './assets.repository';
import { categoriesRepository } from '../categories/categories.repository';
import { activityLogsService } from '../activity-logs/activity-logs.service';
import { ASSET_STATUS_TRANSITIONS } from '../../common/constants';
import { env } from '../../config/env';

export class AssetsService {
  async getById(id: string) {
    const asset = await assetsRepository.findById(id);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }
    return asset;
  }

  async getByTag(tag: string) {
    const asset = await assetsRepository.findByTag(tag);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }
    return asset;
  }

  async generateAssetTag(): Promise<string> {
    const count = await assetsRepository.count();
    return `AF-${String(count + 1).padStart(4, '0')}`;
  }

  async generateQrCode(assetTag: string): Promise<string> {
    const fileName = `qr-${assetTag}.png`;
    // Write directly inside the local uploads/assets directory
    const qrPath = path.join(env.UPLOAD_DIR, 'assets', fileName);
    
    await QRCode.toFile(qrPath, `ASSETFLOW:${assetTag}`);
    
    // Return relative URL that will be resolved static by Express
    return `/uploads/assets/${fileName}`;
  }

  async create(
    data: {
      name: string;
      categoryId: string;
      serialNumber?: string | null;
      acquisitionDate?: Date | null;
      acquisitionCost?: number | null;
      condition?: 'GOOD' | 'FAIR' | 'POOR';
      location?: string | null;
      isBookable?: boolean;
      customFieldValues?: any;
    },
    files: {
      photo?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
    registeredById: string
  ) {
    // 1. Verify category exists
    const category = await categoriesRepository.findById(data.categoryId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    // 2. Verify unique serial number if provided
    if (data.serialNumber) {
      const existing = await assetsRepository.findBySerial(data.serialNumber);
      if (existing) {
        throw new ApiError(409, 'Serial number already exists');
      }
    }

    // 3. Auto-generate assetTag and QR code
    const assetTag = await this.generateAssetTag();
    const qrCodeUrl = await this.generateQrCode(assetTag);

    // 4. Map uploaded files to schema
    const documentsToCreate: { fileUrl: string; fileType: 'photo' | 'invoice' | 'manual' }[] = [];

    if (files.photo && files.photo.length > 0) {
      documentsToCreate.push({
        fileUrl: `/uploads/assets/${files.photo[0].filename}`,
        fileType: 'photo',
      });
    }

    if (files.documents) {
      files.documents.forEach((file) => {
        // Simple heuristic to differentiate manual vs invoice
        const type: 'invoice' | 'manual' = file.originalname.toLowerCase().includes('manual')
          ? 'manual'
          : 'invoice';
        documentsToCreate.push({
          fileUrl: `/uploads/assets/${file.filename}`,
          fileType: type,
        });
      });
    }

    // 5. Create Asset record in DB
    const asset = await assetsRepository.create({
      ...data,
      assetTag,
      qrCodeUrl,
      registeredById,
      documents: documentsToCreate,
      status: 'AVAILABLE',
    });

    // 6. Log activity
    await activityLogsService.logAction({
      userId: registeredById,
      action: 'ASSET_REGISTERED',
      entityType: 'Asset',
      entityId: asset.id,
      metadata: {
        assetTag,
        name: asset.name,
      },
    });

    return asset;
  }

  async update(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      serialNumber?: string | null;
      acquisitionDate?: Date | null;
      acquisitionCost?: number | null;
      condition?: 'GOOD' | 'FAIR' | 'POOR';
      location?: string | null;
      isBookable?: boolean;
      customFieldValues?: any;
    },
    files: {
      photo?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    },
    actorUserId: string
  ) {
    const asset = await this.getById(id);

    // If changing category, check existence
    if (data.categoryId && data.categoryId !== asset.categoryId) {
      const category = await categoriesRepository.findById(data.categoryId);
      if (!category) {
        throw new ApiError(404, 'Category not found');
      }
    }

    // If changing serial number, check unique
    if (data.serialNumber && data.serialNumber !== asset.serialNumber) {
      const existing = await assetsRepository.findBySerial(data.serialNumber);
      if (existing) {
        throw new ApiError(409, 'Serial number already exists');
      }
    }

    // Map uploaded files
    let documentsToUpdate: { fileUrl: string; fileType: 'photo' | 'invoice' | 'manual' }[] | undefined = undefined;

    const hasNewPhoto = files.photo && files.photo.length > 0;
    const hasNewDocs = files.documents && files.documents.length > 0;

    if (hasNewPhoto || hasNewDocs) {
      documentsToUpdate = [];

      // If we are updating files, we keep unchanged ones or replace them.
      // For simplicity, we create the new ones and append old ones, or replace them entirely.
      // The spec states: "Edit asset metadata". If new files are uploaded, let's add them.
      // We read the existing documents first
      asset.documents.forEach((doc) => {
        // If a new photo is uploaded, we replace the old photo
        if (doc.fileType === 'photo' && hasNewPhoto) return;
        documentsToUpdate?.push({
          fileUrl: doc.fileUrl,
          fileType: doc.fileType as 'photo' | 'invoice' | 'manual',
        });
      });

      if (hasNewPhoto && files.photo) {
        documentsToUpdate.push({
          fileUrl: `/uploads/assets/${files.photo[0].filename}`,
          fileType: 'photo',
        });
      }

      if (files.documents) {
        files.documents.forEach((file) => {
          const type: 'invoice' | 'manual' = file.originalname.toLowerCase().includes('manual')
            ? 'manual'
            : 'invoice';
          documentsToUpdate?.push({
            fileUrl: `/uploads/assets/${file.filename}`,
            fileType: type,
          });
        });
      }
    }

    const updatedAsset = await assetsRepository.update(id, {
      ...data,
      documents: documentsToUpdate,
    });

    await activityLogsService.logAction({
      userId: actorUserId,
      action: 'ASSET_UPDATED',
      entityType: 'Asset',
      entityId: id,
      metadata: {
        fieldsChanged: Object.keys(data),
      },
    });

    return updatedAsset;
  }

  async updateStatus(
    id: string,
    targetStatus: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED',
    actorUserId: string
  ) {
    const asset = await this.getById(id);

    // Validate status transition
    const allowedTransitions = ASSET_STATUS_TRANSITIONS[asset.status];
    if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
      throw new ApiError(400, `Cannot transition asset status from ${asset.status} to ${targetStatus}`);
    }

    const updatedAsset = await assetsRepository.updateStatus(id, targetStatus);

    await activityLogsService.logAction({
      userId: actorUserId,
      action: 'ASSET_STATUS_CHANGED',
      entityType: 'Asset',
      entityId: id,
      metadata: {
        previousStatus: asset.status,
        newStatus: targetStatus,
      },
    });

    return updatedAsset;
  }

  async getHistory(id: string) {
    // Verify asset exists first
    await this.getById(id);
    return assetsRepository.getHistory(id);
  }

  async getAll(query: {
    tag?: string;
    serial?: string;
    category?: string;
    status?: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
    department?: string;
    location?: string;
    page?: string;
    limit?: string;
  }) {
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = parseInt(query.limit || '20', 10);

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const [total, items] = await Promise.all([
      assetsRepository.count(query),
      assetsRepository.findAll(query, skip, take),
    ]);

    return {
      items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}

export const assetsService = new AssetsService();
export default assetsService;
