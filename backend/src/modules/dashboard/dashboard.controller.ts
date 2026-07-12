import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  getKpis = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const kpis = await dashboardService.getKpis(user);
    ApiResponse.success(res, kpis);
  });

  getOverdue = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const overdue = await dashboardService.getOverdue(user);
    ApiResponse.success(res, overdue);
  });

  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const recent = await dashboardService.getRecentActivity(user);
    ApiResponse.success(res, recent);
  });
}

export const dashboardController = new DashboardController();
export default dashboardController;
