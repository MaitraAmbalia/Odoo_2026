import prisma from '../../config/prisma';

export class CategoriesRepository {
  async create(data: {
    name: string;
    description?: string;
    customFieldsSchema?: any;
  }) {
    return prisma.assetCategory.create({
      data: {
        name: data.name,
        description: data.description || null,
        customFieldsSchema: data.customFieldsSchema || null,
      },
    });
  }

  async findById(id: string) {
    return prisma.assetCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });
  }

  async findByName(name: string) {
    return prisma.assetCategory.findUnique({
      where: { name },
    });
  }

  async findAll() {
    return prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    customFieldsSchema?: any;
  }) {
    return prisma.assetCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.assetCategory.delete({
      where: { id },
    });
  }

  async countAssets(categoryId: string) {
    return prisma.asset.count({
      where: { categoryId },
    });
  }
}

export const categoriesRepository = new CategoriesRepository();
export default categoriesRepository;
