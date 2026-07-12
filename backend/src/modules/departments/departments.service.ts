import { ApiError } from '../../common/ApiError';
import { departmentsRepository } from './departments.repository';
import prisma from '../../config/prisma';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  UpdateDepartmentStatusInput,
} from './departments.schema';

export class DepartmentsService {
  async create(input: CreateDepartmentInput) {
    // 1. Check name uniqueness
    const existing = await departmentsRepository.findByName(input.name);
    if (existing) {
      throw new ApiError(409, `Department with name '${input.name}' already exists`);
    }

    // 2. Validate parent if provided
    if (input.parentDepartmentId) {
      const parent = await departmentsRepository.findById(input.parentDepartmentId);
      if (!parent) {
        throw new ApiError(404, 'Parent department not found');
      }
      if (parent.status === 'INACTIVE') {
        throw new ApiError(400, 'Cannot set an inactive department as parent');
      }
    }

    // 3. Validate head user if provided
    if (input.headUserId) {
      const user = await prisma.user.findUnique({ where: { id: input.headUserId } });
      if (!user) {
        throw new ApiError(404, 'Head user not found');
      }
    }

    const department = await departmentsRepository.create(input);

    // 4. Update the head user's department relation if needed
    if (input.headUserId) {
      await prisma.user.update({
        where: { id: input.headUserId },
        data: { departmentId: department.id },
      });
    }

    return department;
  }

  async getById(id: string) {
    const department = await departmentsRepository.findById(id);
    if (!department) {
      throw new ApiError(404, 'Department not found');
    }
    return department;
  }

  async getAll() {
    return departmentsRepository.findAll();
  }

  async update(id: string, input: UpdateDepartmentInput) {
    const department = await this.getById(id);

    // 1. Check name uniqueness if changed
    if (input.name && input.name.toLowerCase() !== department.name.toLowerCase()) {
      const existing = await departmentsRepository.findByName(input.name);
      if (existing) {
        throw new ApiError(409, `Department with name '${input.name}' already exists`);
      }
    }

    // 2. Validate parent hierarchy and avoid circular dependencies
    if (input.parentDepartmentId) {
      const parent = await departmentsRepository.findById(input.parentDepartmentId);
      if (!parent) {
        throw new ApiError(404, 'Parent department not found');
      }
      if (parent.status === 'INACTIVE') {
        throw new ApiError(400, 'Cannot set an inactive department as parent');
      }
      await this.validateHierarchy(id, input.parentDepartmentId);
    }

    // 3. Validate head user if provided
    if (input.headUserId) {
      const user = await prisma.user.findUnique({ where: { id: input.headUserId } });
      if (!user) {
        throw new ApiError(404, 'Head user not found');
      }
      // Set user's department to this department
      await prisma.user.update({
        where: { id: input.headUserId },
        data: { departmentId: id },
      });
    }

    return departmentsRepository.update(id, {
      name: input.name,
      headUserId: input.headUserId,
      parentDepartmentId: input.parentDepartmentId,
    });
  }

  async updateStatus(id: string, input: UpdateDepartmentStatusInput) {
    const department = await this.getById(id);

    if (department.status === input.status) {
      return department;
    }

    // If activating, verify parent is active first
    if (input.status === 'ACTIVE' && department.parentDepartmentId) {
      const parent = await departmentsRepository.findById(department.parentDepartmentId);
      if (parent && parent.status === 'INACTIVE') {
        throw new ApiError(400, 'Cannot activate department because parent department is inactive');
      }
    }

    await departmentsRepository.updateStatusRecursive(id, input.status);
    return this.getById(id);
  }

  private async validateHierarchy(departmentId: string, parentId: string) {
    if (departmentId === parentId) {
      throw new ApiError(400, 'A department cannot be its own parent');
    }

    const allDepts = await departmentsRepository.findAll();
    let currentParentId: string | null = parentId;

    while (currentParentId) {
      if (currentParentId === departmentId) {
        throw new ApiError(400, 'Circular dependency detected: parent department is a descendant of this department');
      }
      const parentNode = allDepts.find((d) => d.id === currentParentId);
      currentParentId = parentNode ? parentNode.parentDepartmentId : null;
    }
  }
}

export const departmentsService = new DepartmentsService();
