import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { auditsService } from './audits.service';

export class AuditsController {
  createCycle = asyncHandler(async (req: Request, res: Response) => {
    const createdById = req.user!.id;
    const cycle = await auditsService.createCycle(createdById, req.body);
    ApiResponse.created(res, cycle, 'Audit cycle created and initialized successfully');
  });

  verifyItem = asyncHandler(async (req: Request, res: Response) => {
    const verifier = req.user!;
    const { id, itemId } = req.params as { id: string; itemId: string };

    const item = await auditsService.verifyItem(itemId, id, verifier, req.body);
    ApiResponse.success(res, item, 'Audit item verification updated');
  });

  closeCycle = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.user!.id;
    const { id } = req.params as { id: string };

    const cycle = await auditsService.closeCycle(id, callerId);
    ApiResponse.success(res, cycle, 'Audit cycle closed successfully. Missing items flagged as LOST.');
  });

  listCycles = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { page, limit } = req.query as any;

    const { items, total } = await auditsService.listCycles(caller, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    ApiResponse.paginated(res, items, total, Number(page) || 1, Number(limit) || 20);
  });

  getCycleDetail = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { id } = req.params as { id: string };

    const cycle = await auditsService.getCycleDetail(id, caller);
    ApiResponse.success(res, cycle);
  });

  listDiscrepancies = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const items = await auditsService.getDiscrepancies(id);
    ApiResponse.success(res, items);
  });
}

export const auditsController = new AuditsController();
