import { ApiError } from '../../common/ApiError';
import { employeesRepository } from './employees.repository';
import { departmentsRepository } from '../departments/departments.repository';
import { notificationsService } from '../notifications/notifications.service';
import { activityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationType } from '@prisma/client';

export class EmployeesService {
  async getById(id: string) {
    const employee = await employeesRepository.findById(id);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }
    return employee;
  }

  async update(id: string, data: {
    name?: string;
    departmentId?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
  }) {
    // 1. Verify employee exists
    await this.getById(id);

    // 2. Verify department exists if departmentId is provided
    if (data.departmentId) {
      const dept = await departmentsRepository.findById(data.departmentId);
      if (!dept) {
        throw new ApiError(404, 'Department not found');
      }
    }

    return employeesRepository.update(id, data);
  }

  async promote(id: string, role: 'DEPARTMENT_HEAD' | 'ASSET_MANAGER', actorUserId: string) {
    // 1. Cannot promote yourself
    if (id === actorUserId) {
      throw new ApiError(400, 'Cannot promote yourself');
    }

    // 2. Fetch employee to verify existence and get current role
    const employee = await this.getById(id);

    // 3. Update the role in database
    const updatedEmployee = await employeesRepository.updateRole(id, role);

    // 4. Create Notification for the user
    const humanRoleName = role.replace('_', ' ');
    await notificationsService.createNotification({
      userId: id,
      type: NotificationType.ROLE_CHANGED,
      message: `Your role has been updated to ${humanRoleName}`,
      relatedEntityType: 'User',
      relatedEntityId: id,
    });

    // 5. Log Activity Log
    await activityLogsService.logAction({
      userId: actorUserId,
      action: 'PROMOTE_EMPLOYEE',
      entityType: 'User',
      entityId: id,
      metadata: {
        previousRole: employee.role,
        newRole: role,
        employeeName: employee.name,
      },
    });

    return updatedEmployee;
  }

  async getAll(query: {
    department?: string;
    role?: 'ADMIN' | 'DEPARTMENT_HEAD' | 'ASSET_MANAGER' | 'EMPLOYEE';
    status?: 'ACTIVE' | 'INACTIVE';
    page?: string;
    limit?: string;
  }) {
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = parseInt(query.limit || '10', 10);

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const { total, items } = await employeesRepository.findAllPaginated({
      departmentId: query.department,
      role: query.role,
      status: query.status,
      skip,
      take,
    });

    return {
      items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}

export const employeesService = new EmployeesService();
export default employeesService;
