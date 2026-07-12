import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { categoriesService } from './categories.service';

export class CategoriesController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoriesService.create(req.body);
    ApiResponse.created(res, category, 'Category created successfully');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoriesService.getById(req.params.id as string);
    ApiResponse.success(res, category);
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoriesService.getAll();
    ApiResponse.success(res, categories);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoriesService.update(req.params.id as string, req.body);
    ApiResponse.success(res, category, 'Category updated successfully');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await categoriesService.delete(req.params.id as string);
    ApiResponse.success(res, null, 'Category deleted successfully');
  });
}

export const categoriesController = new CategoriesController();
export default categoriesController;
