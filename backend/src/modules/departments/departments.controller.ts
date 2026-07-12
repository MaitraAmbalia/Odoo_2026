import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { departmentsService } from './departments.service';

export class DepartmentsController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentsService.create(req.body);
    ApiResponse.created(res, department, 'Department created successfully');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentsService.getById(req.params.id as string);
    ApiResponse.success(res, department);
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const departments = await departmentsService.getAll();
    ApiResponse.success(res, departments);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentsService.update(req.params.id as string, req.body);
    ApiResponse.success(res, department, 'Department updated successfully');
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const department = await departmentsService.updateStatus(req.params.id as string, req.body);
    ApiResponse.success(res, department, `Department and all sub-departments set to ${req.body.status}`);
  });
}

export const departmentsController = new DepartmentsController();
