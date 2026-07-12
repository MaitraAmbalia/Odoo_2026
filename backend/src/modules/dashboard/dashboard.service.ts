import prisma from '../../config/prisma';
import { ApiError } from '../../common/ApiError';

export class DashboardService {
  async getKpis(user: { id: string; role: string; departmentId: string | null }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Scoping query filters
    const assetWhere: any = {};
    const maintenanceWhere: any = {};
    const bookingWhere: any = {};
    const transferWhere: any = {};
    const returnWhere: any = {};

    if (user.role === 'EMPLOYEE') {
      assetWhere.allocations = {
        some: {
          allocatedToUserId: user.id,
          status: 'ACTIVE',
        },
      };

      maintenanceWhere.raisedByUserId = user.id;
      maintenanceWhere.createdAt = { gte: today, lt: tomorrow };

      bookingWhere.bookedByUserId = user.id;
      bookingWhere.status = 'ONGOING';

      transferWhere.requestedByUserId = user.id;
      transferWhere.status = 'REQUESTED';

      returnWhere.allocatedToUserId = user.id;
      returnWhere.status = 'ACTIVE';
      returnWhere.expectedReturnDate = { gte: new Date() };

    } else if (user.role === 'DEPARTMENT_HEAD') {
      if (!user.departmentId) {
        throw new ApiError(400, 'Department head user is not assigned to a department');
      }

      assetWhere.allocations = {
        some: {
          allocatedToDepartmentId: user.departmentId,
          status: 'ACTIVE',
        },
      };

      maintenanceWhere.raisedBy = {
        departmentId: user.departmentId,
      };
      maintenanceWhere.createdAt = { gte: today, lt: tomorrow };

      bookingWhere.bookedBy = {
        departmentId: user.departmentId,
      };
      bookingWhere.status = 'ONGOING';

      transferWhere.OR = [
        { requestedByUser: { departmentId: user.departmentId } },
        { toDepartmentId: user.departmentId },
      ];
      transferWhere.status = 'REQUESTED';

      returnWhere.allocatedToDepartmentId = user.departmentId;
      returnWhere.status = 'ACTIVE';
      returnWhere.expectedReturnDate = { gte: new Date() };

    } else {
      // ADMIN or ASSET_MANAGER
      assetWhere.status = 'ALLOCATED';
      
      maintenanceWhere.createdAt = { gte: today, lt: tomorrow };
      
      bookingWhere.status = 'ONGOING';
      
      transferWhere.status = 'REQUESTED';
      
      returnWhere.status = 'ACTIVE';
      returnWhere.expectedReturnDate = { gte: new Date() };
    }

    const [
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
    ] = await Promise.all([
      // Available assets are counted globally because they are available to anyone
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      user.role === 'ADMIN' || user.role === 'ASSET_MANAGER'
        ? prisma.asset.count({ where: { status: 'ALLOCATED' } })
        : prisma.asset.count({ where: assetWhere }),
      prisma.maintenanceRequest.count({ where: maintenanceWhere }),
      prisma.booking.count({ where: bookingWhere }),
      prisma.assetTransferRequest.count({ where: transferWhere }),
      prisma.assetAllocation.count({ where: returnWhere }),
    ]);

    return {
      assetsAvailable,
      assetsAllocated,
      maintenanceToday,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
    };
  }

  async getOverdue(user: { id: string; role: string; departmentId: string | null }) {
    const returnWhere: any = {
      status: 'OVERDUE',
    };

    const bookingWhere: any = {
      status: 'ONGOING',
      endTime: { lt: new Date() },
    };

    const maintenanceWhere: any = {
      status: 'PENDING',
      createdAt: { lt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }, // pending for more than 2 days
    };

    if (user.role === 'EMPLOYEE') {
      returnWhere.allocatedToUserId = user.id;
      bookingWhere.bookedByUserId = user.id;
      maintenanceWhere.raisedByUserId = user.id;
    } else if (user.role === 'DEPARTMENT_HEAD') {
      if (!user.departmentId) {
        throw new ApiError(400, 'Department head user is not assigned to a department');
      }
      returnWhere.allocatedToDepartmentId = user.departmentId;
      bookingWhere.bookedBy = { departmentId: user.departmentId };
      maintenanceWhere.raisedBy = { departmentId: user.departmentId };
    }

    const [overdueAllocations, overdueBookings, overdueMaintenance] = await Promise.all([
      prisma.assetAllocation.findMany({
        where: returnWhere,
        include: {
          asset: { select: { id: true, name: true, assetTag: true } },
          allocatedToUser: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.booking.findMany({
        where: bookingWhere,
        include: {
          asset: { select: { id: true, name: true, assetTag: true } },
          bookedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.maintenanceRequest.findMany({
        where: maintenanceWhere,
        include: {
          asset: { select: { id: true, name: true, assetTag: true } },
          raisedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      allocations: overdueAllocations,
      bookings: overdueBookings,
      maintenance: overdueMaintenance,
    };
  }

  async getRecentActivity(user: { id: string; role: string; departmentId: string | null }) {
    const where: any = {};

    if (user.role === 'EMPLOYEE') {
      where.userId = user.id;
    } else if (user.role === 'DEPARTMENT_HEAD') {
      if (!user.departmentId) {
        throw new ApiError(400, 'Department head user is not assigned to a department');
      }
      where.user = {
        departmentId: user.departmentId,
      };
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return logs;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
