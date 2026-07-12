import prisma from '../../config/prisma';

export class DepartmentsRepository {
  async create(data: {
    name: string;
    headUserId?: string;
    parentDepartmentId?: string;
  }) {
    return prisma.department.create({
      data: {
        name: data.name,
        headUserId: data.headUserId || null,
        parentDepartmentId: data.parentDepartmentId || null,
      },
      include: {
        head: true,
        parentDepartment: true,
        childDepartments: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        head: true,
        parentDepartment: true,
        childDepartments: true,
      },
    });
  }

  async findByName(name: string) {
    return prisma.department.findUnique({
      where: { name },
    });
  }

  async update(id: string, data: {
    name?: string;
    headUserId?: string | null;
    parentDepartmentId?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
  }) {
    return prisma.department.update({
      where: { id },
      data,
      include: {
        head: true,
        parentDepartment: true,
      },
    });
  }

  async findAll() {
    return prisma.department.findMany({
      include: {
        head: {
          select: { id: true, name: true, email: true },
        },
        parentDepartment: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateStatusRecursive(departmentId: string, status: 'ACTIVE' | 'INACTIVE') {
    // Transactional status propagation:
    // 1. Fetch all departments to trace descendants in memory.
    const allDepts = await prisma.department.findMany();

    const descendantIds: string[] = [];
    const collectDescendants = (id: string) => {
      const children = allDepts.filter((d) => d.parentDepartmentId === id);
      for (const child of children) {
        descendantIds.push(child.id);
        collectDescendants(child.id);
      }
    };

    collectDescendants(departmentId);
    const targetDeptIds = [departmentId, ...descendantIds];

    return prisma.$transaction(async (tx) => {
      // Update all target departments
      await tx.department.updateMany({
        where: { id: { in: targetDeptIds } },
        data: { status },
      });

      // If deactivating, also deactivate all users in these departments
      if (status === 'INACTIVE') {
        await tx.user.updateMany({
          where: { departmentId: { in: targetDeptIds } },
          data: { status: 'INACTIVE' },
        });
      }

      return targetDeptIds;
    });
  }
}

export const departmentsRepository = new DepartmentsRepository();
