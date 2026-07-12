import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { employeesService } from './employees.service';
import { ApiError } from '../../common/ApiError';

export class EmployeesController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await employeesService.getAll({
      department: req.query.department as string | undefined,
      role: req.query.role as any,
      status: req.query.status as any,
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    });
    ApiResponse.success(res, result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const targetId = req.params.id as string;
    const currentUser = (req as any).user;

    // Access control: ADMIN can view anyone, employees can only view themselves
    if (currentUser.role !== 'ADMIN' && currentUser.id !== targetId) {
      throw new ApiError(403, 'Access denied: you can only view your own profile');
    }

    const employee = await employeesService.getById(targetId);
    ApiResponse.success(res, employee);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeesService.update(req.params.id as string, req.body);
    ApiResponse.success(res, employee, 'Employee updated successfully');
  });

  promote = asyncHandler(async (req: Request, res: Response) => {
    const targetId = req.params.id as string;
    const { role } = req.body;
    const currentUser = (req as any).user;

    const employee = await employeesService.promote(targetId, role, currentUser.id);
    ApiResponse.success(res, employee, 'Employee promoted successfully');
  });
}

export const employeesController = new EmployeesController();
export default employeesController;
