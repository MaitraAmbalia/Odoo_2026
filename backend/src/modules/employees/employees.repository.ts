import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class EmployeesRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    departmentId?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
  }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateRole(id: string, role: 'DEPARTMENT_HEAD' | 'ASSET_MANAGER') {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findAllPaginated(filters: {
    departmentId?: string;
    role?: 'ADMIN' | 'DEPARTMENT_HEAD' | 'ASSET_MANAGER' | 'EMPLOYEE';
    status?: 'ACTIVE' | 'INACTIVE';
    skip: number;
    take: number;
  }) {
    const where: Prisma.UserWhereInput = {};

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [total, items] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          departmentId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: filters.skip,
        take: filters.take,
      }),
    ]);

    return { total, items };
  }
}

export const employeesRepository = new EmployeesRepository();
export default employeesRepository;
