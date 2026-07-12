import { ApiError } from '../../common/ApiError';
import { categoriesRepository } from './categories.repository';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

export class CategoriesService {
  async create(input: CreateCategoryInput) {
    const existing = await categoriesRepository.findByName(input.name);
    if (existing) {
      throw new ApiError(409, `Category with name '${input.name}' already exists`);
    }

    return categoriesRepository.create(input);
  }

  async getById(id: string) {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  }

  async getAll() {
    return categoriesRepository.findAll();
  }

  async update(id: string, input: UpdateCategoryInput) {
    const category = await this.getById(id);

    if (input.name && input.name.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await categoriesRepository.findByName(input.name);
      if (existing) {
        throw new ApiError(409, `Category with name '${input.name}' already exists`);
      }
    }

    return categoriesRepository.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);

    const assetCount = await categoriesRepository.countAssets(id);
    if (assetCount > 0) {
      throw new ApiError(409, 'Cannot delete: category has associated assets');
    }

    return categoriesRepository.delete(id);
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;
