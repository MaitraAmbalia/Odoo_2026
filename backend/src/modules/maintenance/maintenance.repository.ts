import { MaintenanceStatus, MaintenancePriority, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class MaintenanceRepository {
  async createRequest(data: {
    assetId: string;
    raisedById: string;
    issueDescription: string;
    priority: MaintenancePriority;
    photoUrl?: string | null;
  }) {
    return prisma.maintenanceRequest.create({
      data: {
        assetId: data.assetId,
        raisedById: data.raisedById,
        issueDescription: data.issueDescription,
        priority: data.priority,
        photoUrl: data.photoUrl || null,
        status: 'PENDING',
      },
      include: {
        asset: true,
        raisedBy: true,
      },
    });
  }

  async getRequestById(id: string) {
    return prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        raisedBy: true,
        approvedBy: true,
      },
    });
  }

  async findAllRequests(where: Prisma.MaintenanceRequestWhereInput, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: true,
          raisedBy: true,
        },
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    return { items, total };
  }

  async approveRequestTransaction(id: string, approverId: string, assetId: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: approverId,
        },
        include: {
          asset: true,
          raisedBy: true,
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'UNDER_MAINTENANCE' },
      });

      return request;
    });
  }

  async rejectRequest(id: string, approverId: string) {
    return prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: approverId,
      },
      include: {
        asset: true,
        raisedBy: true,
      },
    });
  }

  async assignTechnician(id: string, technicianName: string) {
    return prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'TECHNICIAN_ASSIGNED',
        technicianName,
      },
      include: {
        asset: true,
        raisedBy: true,
      },
    });
  }

  async updateRequestStatus(id: string, status: MaintenanceStatus) {
    return prisma.maintenanceRequest.update({
      where: { id },
      data: { status },
      include: {
        asset: true,
        raisedBy: true,
      },
    });
  }

  async resolveRequestTransaction(id: string, assetId: string, resolutionNotes: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolutionNotes,
          resolvedAt: new Date(),
        },
        include: {
          asset: true,
          raisedBy: true,
        },
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'AVAILABLE' },
      });

      return request;
    });
  }
}

export const maintenanceRepository = new MaintenanceRepository();
