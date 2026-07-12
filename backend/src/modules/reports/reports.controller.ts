import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { reportsService } from './reports.service';

export class ReportsController {
  getUtilization = asyncHandler(async (_req: Request, res: Response) => {
    const data = await reportsService.getAssetUtilization();
    ApiResponse.success(res, data);
  });

  getMaintenanceFrequency = asyncHandler(async (_req: Request, res: Response) => {
    const data = await reportsService.getMaintenanceFrequency();
    ApiResponse.success(res, data);
  });

  getDueForMaintenance = asyncHandler(async (_req: Request, res: Response) => {
    const data = await reportsService.getDueForMaintenance();
    ApiResponse.success(res, data);
  });

  getDepartmentAllocationSummary = asyncHandler(async (_req: Request, res: Response) => {
    const data = await reportsService.getDepartmentAllocationSummary();
    ApiResponse.success(res, data);
  });

  getBookingHeatmap = asyncHandler(async (_req: Request, res: Response) => {
    const data = await reportsService.getBookingHeatmap();
    ApiResponse.success(res, data);
  });

  exportReport = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.query as { type: string };

    const csvData = await reportsService.exportToCsv(type);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
    res.send(csvData);
  });
}

export const reportsController = new ReportsController();
