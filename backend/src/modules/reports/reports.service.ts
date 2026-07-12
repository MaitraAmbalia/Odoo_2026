import prisma from '../../config/prisma';

export class ReportsService {
  async getAssetUtilization() {
    const assets = await prisma.asset.findMany({
      where: {
        status: { notIn: ['RETIRED', 'DISPOSED'] },
      },
      select: {
        id: true,
        name: true,
        assetTag: true,
        status: true,
        _count: {
          select: {
            allocations: true,
            bookings: true,
          },
        },
      },
    });

    const mapped = assets.map((a) => ({
      id: a.id,
      name: a.name,
      assetTag: a.assetTag,
      status: a.status,
      bookingsCount: a._count.bookings,
      allocationsCount: a._count.allocations,
      totalUsage: a._count.bookings + a._count.allocations,
    }));

    // Sort to get top 10 most used
    const mostUsed = [...mapped]
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 10);

    // Idle are assets with 0 usage
    const idle = mapped.filter((a) => a.totalUsage === 0);

    return { mostUsed, idle };
  }

  async getMaintenanceFrequency() {
    // 1. Grouped by Asset
    const assets = await prisma.asset.findMany({
      where: {
        status: { notIn: ['RETIRED', 'DISPOSED'] },
      },
      select: {
        id: true,
        name: true,
        assetTag: true,
        _count: {
          select: { maintenanceRequests: true },
        },
      },
    });

    const byAsset = assets
      .map((a) => ({
        id: a.id,
        name: `${a.name} (${a.assetTag})`,
        maintenanceCount: a._count.maintenanceRequests,
      }))
      .sort((a, b) => b.maintenanceCount - a.maintenanceCount);

    // 2. Grouped by Category
    const categories = await prisma.assetCategory.findMany({
      select: {
        id: true,
        name: true,
        assets: {
          select: {
            _count: {
              select: { maintenanceRequests: true },
            },
          },
        },
      },
    });

    const byCategory = categories
      .map((c) => {
        const count = c.assets.reduce((sum, asset) => sum + asset._count.maintenanceRequests, 0);
        return {
          id: c.id,
          name: c.name,
          maintenanceCount: count,
        };
      })
      .sort((a, b) => b.maintenanceCount - a.maintenanceCount);

    return { byAsset, byCategory };
  }

  async getDueForMaintenance() {
    const now = new Date();
    // Heuristic limit: acquired over 3 years ago (near retirement)
    const threeYearsAgo = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);

    const assets = await prisma.asset.findMany({
      where: {
        status: { notIn: ['RETIRED', 'DISPOSED'] },
        OR: [
          { condition: { in: ['POOR', 'DAMAGED'] } },
          { acquisitionDate: { lt: threeYearsAgo } },
        ],
      },
      select: {
        id: true,
        name: true,
        assetTag: true,
        condition: true,
        acquisitionDate: true,
        status: true,
      },
      orderBy: { acquisitionDate: 'asc' },
    });

    return assets.map((a) => {
      const reasons: string[] = [];
      if (a.condition === 'POOR' || a.condition === 'DAMAGED') {
        reasons.push(`Asset is in ${a.condition} condition`);
      }
      if (a.acquisitionDate && a.acquisitionDate < threeYearsAgo) {
        reasons.push('Asset is near retirement lifespan (> 3 years old)');
      }
      return {
        ...a,
        reason: reasons.join(' and '),
      };
    });
  }

  async getDepartmentAllocationSummary() {
    const allocations = await prisma.assetAllocation.findMany({
      where: { status: 'ACTIVE' },
      include: {
        asset: true,
        allocatedToDepartment: true,
        allocatedToUser: {
          include: { department: true },
        },
      },
    });

    const deptSummary: Record<string, { id: string; name: string; count: number; totalCost: number }> = {};

    for (const alloc of allocations) {
      let deptId = 'unassigned';
      let deptName = 'Unassigned';

      if (alloc.allocatedToDepartmentId && alloc.allocatedToDepartment) {
        deptId = alloc.allocatedToDepartmentId;
        deptName = alloc.allocatedToDepartment.name;
      } else if (alloc.allocatedToUser?.departmentId && alloc.allocatedToUser.department) {
        deptId = alloc.allocatedToUser.departmentId;
        deptName = alloc.allocatedToUser.department.name;
      }

      if (!deptSummary[deptId]) {
        deptSummary[deptId] = { id: deptId, name: deptName, count: 0, totalCost: 0 };
      }

      deptSummary[deptId].count += 1;
      deptSummary[deptId].totalCost += alloc.asset?.acquisitionCost ? Number(alloc.asset.acquisitionCost) : 0;
    }

    return Object.values(deptSummary).sort((a, b) => b.count - a.count);
  }

  async getBookingHeatmap() {
    const bookings = await prisma.booking.findMany({
      select: { startTime: true },
    });

    // Initialize 7 days x 24 hours grid
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));

    for (const b of bookings) {
      const date = new Date(b.startTime);
      const day = date.getDay(); // 0 is Sunday, 6 is Saturday
      const hour = date.getHours(); // 0-23
      heatmap[day][hour] += 1;
    }

    return heatmap;
  }

  async exportToCsv(type: string): Promise<string> {
    switch (type) {
      case 'utilization': {
        const data = await this.getAssetUtilization();
        let csv = 'Asset ID,Asset Name,Asset Tag,Bookings Count,Allocations Count,Total Usage,Status\n';
        for (const item of data.mostUsed) {
          csv += `"${item.id}","${item.name}","${item.assetTag}",${item.bookingsCount},${item.allocationsCount},${item.totalUsage},"${item.status}"\n`;
        }
        for (const item of data.idle) {
          csv += `"${item.id}","${item.name}","${item.assetTag}",${item.bookingsCount},${item.allocationsCount},${item.totalUsage},"${item.status}"\n`;
        }
        return csv;
      }
      case 'maintenance-frequency': {
        const data = await this.getMaintenanceFrequency();
        let csv = 'Group Type,Entity ID,Name,Maintenance Count\n';
        for (const item of data.byAsset) {
          csv += `"Asset","${item.id}","${item.name}",${item.maintenanceCount}\n`;
        }
        for (const item of data.byCategory) {
          csv += `"Category","${item.id}","${item.name}",${item.maintenanceCount}\n`;
        }
        return csv;
      }
      case 'due-for-maintenance': {
        const data = await this.getDueForMaintenance();
        let csv = 'Asset ID,Asset Name,Asset Tag,Condition,Acquisition Date,Status,Reason\n';
        for (const item of data) {
          const acqDateStr = item.acquisitionDate ? item.acquisitionDate.toISOString() : '';
          csv += `"${item.id}","${item.name}","${item.assetTag}","${item.condition}","${acqDateStr}","${item.status}","${item.reason}"\n`;
        }
        return csv;
      }
      case 'department-allocation-summary': {
        const data = await this.getDepartmentAllocationSummary();
        let csv = 'Department ID,Department Name,Active Allocations Count,Total Allocations Cost\n';
        for (const item of data) {
          csv += `"${item.id}","${item.name}",${item.count},${item.totalCost}\n`;
        }
        return csv;
      }
      case 'booking-heatmap': {
        const data = await this.getBookingHeatmap();
        let csv = 'Day of Week,Hour,Bookings Count\n';
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            csv += `"${days[day]}",${hour},${data[day][hour]}\n`;
          }
        }
        return csv;
      }
      default:
        throw new Error('Invalid report type');
    }
  }
}

export const reportsService = new ReportsService();
