import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { maintenanceService } from './maintenance.service';

export class MaintenanceController {
  createRequest = asyncHandler(async (req: Request, res: Response) => {
    const raisedById = req.user!.id;
    
    // Express 5.x typing for file
    const photoFile = req.file;
    const photoUrl = photoFile ? `/uploads/maintenance/${photoFile.filename}` : null;

    const request = await maintenanceService.createRequest(raisedById, req.body, photoUrl);
    ApiResponse.created(res, request, 'Maintenance request raised successfully');
  });

  approveRequest = asyncHandler(async (req: Request, res: Response) => {
    const approverId = req.user!.id;
    const { id } = req.params as { id: string };

    const request = await maintenanceService.approveRequest(id, approverId);
    ApiResponse.success(res, request, 'Maintenance request approved successfully');
  });

  rejectRequest = asyncHandler(async (req: Request, res: Response) => {
    const approverId = req.user!.id;
    const { id } = req.params as { id: string };

    const request = await maintenanceService.rejectRequest(id, approverId);
    ApiResponse.success(res, request, 'Maintenance request rejected successfully');
  });

  assignTechnician = asyncHandler(async (req: Request, res: Response) => {
    const approverId = req.user!.id;
    const { id } = req.params as { id: string };
    const { technicianName } = req.body;

    const request = await maintenanceService.assignTechnician(id, approverId, technicianName);
    ApiResponse.success(res, request, 'Technician assigned successfully');
  });

  startRequest = asyncHandler(async (req: Request, res: Response) => {
    const approverId = req.user!.id;
    const { id } = req.params as { id: string };

    const request = await maintenanceService.startRequest(id, approverId);
    ApiResponse.success(res, request, 'Maintenance request started (in progress)');
  });

  resolveRequest = asyncHandler(async (req: Request, res: Response) => {
    const approverId = req.user!.id;
    const { id } = req.params as { id: string };
    const { resolutionNotes } = req.body;

    const request = await maintenanceService.resolveRequest(id, approverId, resolutionNotes);
    ApiResponse.success(res, request, 'Maintenance request resolved successfully');
  });

  getRequestDetail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const request = await maintenanceService.getRequestDetail(id);
    ApiResponse.success(res, request);
  });

  listRequests = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { page, limit } = req.query as any;

    const { items, total } = await maintenanceService.listRequests(caller, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    ApiResponse.paginated(res, items, total, Number(page) || 1, Number(limit) || 20);
  });
}

export const maintenanceController = new MaintenanceController();
