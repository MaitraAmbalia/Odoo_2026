import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { activityLogsService } from './activity-logs.service';

export class ActivityLogsController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await activityLogsService.getAll({
      actorUserId: req.query.actorUserId as string | undefined,
      entityType: req.query.entityType as string | undefined,
      startDate: req.query.startDate as any,
      endDate: req.query.endDate as any,
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    });
    ApiResponse.success(res, result);
  });
}

export const activityLogsController = new ActivityLogsController();
export default activityLogsController;
