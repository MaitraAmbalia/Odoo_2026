import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { assetsService } from './assets.service';
import { ApiError } from '../../common/ApiError';

export class AssetsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await assetsService.getAll({
      tag: req.query.tag as string | undefined,
      serial: req.query.serial as string | undefined,
      category: req.query.category as string | undefined,
      status: req.query.status as any,
      department: req.query.department as string | undefined,
      location: req.query.location as string | undefined,
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    });
    ApiResponse.success(res, result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const asset = await assetsService.getById(req.params.id as string);
    ApiResponse.success(res, asset);
  });

  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await assetsService.getHistory(req.params.id as string);
    ApiResponse.success(res, history);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files || {}) as {
      photo?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    };
    const currentUser = (req as any).user;

    const asset = await assetsService.create(req.body, files, currentUser.id);
    ApiResponse.success(res, asset, 'Asset registered successfully', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files || {}) as {
      photo?: Express.Multer.File[];
      documents?: Express.Multer.File[];
    };
    const currentUser = (req as any).user;

    const asset = await assetsService.update(req.params.id as string, req.body, files, currentUser.id);
    ApiResponse.success(res, asset, 'Asset updated successfully');
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const currentUser = (req as any).user;

    const asset = await assetsService.updateStatus(req.params.id as string, status, currentUser.id);
    ApiResponse.success(res, asset, 'Asset status updated successfully');
  });

  getQrCode = asyncHandler(async (req: Request, res: Response) => {
    const asset = await assetsService.getById(req.params.id as string);
    if (!asset.qrCodeUrl) {
      throw new ApiError(404, 'QR code not found for this asset');
    }
    ApiResponse.success(res, { qrCodeUrl: asset.qrCodeUrl });
  });
}

export const assetsController = new AssetsController();
export default assetsController;
