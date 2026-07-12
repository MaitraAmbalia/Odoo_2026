import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { allocationsService } from './allocations.service';

export class AllocationsController {
  getAllocations = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { page, limit } = req.query as any;

    const { items, total } = await allocationsService.getAllocations(caller, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    ApiResponse.paginated(res, items, total, Number(page) || 1, Number(limit) || 20);
  });

  createAllocation = asyncHandler(async (req: Request, res: Response) => {
    const callerId = req.user!.id;
    const allocation = await allocationsService.allocateAsset(callerId, req.body);
    ApiResponse.created(res, allocation, 'Asset allocated successfully');
  });

  returnAllocation = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { id } = req.params as { id: string };

    const allocation = await allocationsService.returnAllocation(id, caller, req.body);
    ApiResponse.success(res, allocation, 'Asset returned successfully');
  });

  createTransferRequest = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { id } = req.params as { id: string }; // allocation ID

    const request = await allocationsService.createTransferRequest(id, caller, req.body);
    ApiResponse.created(res, request, 'Transfer request raised successfully');
  });

  getTransferRequests = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { page, limit } = req.query as any;

    const { items, total } = await allocationsService.getTransferRequests(caller, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    ApiResponse.paginated(res, items, total, Number(page) || 1, Number(limit) || 20);
  });

  approveTransferRequest = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { id } = req.params as { id: string }; // transfer request ID
    const { notes } = req.body;

    const request = await allocationsService.approveTransferRequest(id, caller, notes);
    ApiResponse.success(res, request, 'Transfer request approved and executed successfully');
  });

  rejectTransferRequest = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { id } = req.params as { id: string }; // transfer request ID
    const { notes } = req.body;

    const request = await allocationsService.rejectTransferRequest(id, caller, notes);
    ApiResponse.success(res, request, 'Transfer request rejected successfully');
  });
}

export const allocationsController = new AllocationsController();
