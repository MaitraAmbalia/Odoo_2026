import { AllocationStatus, TransferStatus, AssetStatus, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class AllocationsRepository {
  async findActiveAllocationByAssetId(assetId: string) {
    return prisma.assetAllocation.findFirst({
      where: { assetId, status: 'ACTIVE' },
      include: {
        allocatedToUser: true,
        allocatedToDepartment: true,
      },
    });
  }

  async findActiveAllocationById(id: string) {
    return prisma.assetAllocation.findFirst({
      where: { id, status: 'ACTIVE' },
      include: {
        allocatedToUser: true,
        allocatedToDepartment: true,
      },
    });
  }

  async findAllocationById(id: string) {
    return prisma.assetAllocation.findUnique({
      where: { id },
      include: {
        asset: true,
        allocatedToUser: true,
        allocatedToDepartment: true,
        allocatedBy: true,
      },
    });
  }

  async findAllAllocations(where: Prisma.AssetAllocationWhereInput, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.assetAllocation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: true,
          allocatedToUser: true,
          allocatedToDepartment: true,
          allocatedBy: true,
        },
      }),
      prisma.assetAllocation.count({ where }),
    ]);

    return { items, total };
  }

  async createAllocation(data: {
    assetId: string;
    allocatedToUserId?: string | null;
    allocatedToDepartmentId?: string | null;
    allocatedById: string;
    expectedReturnDate?: Date | null;
    conditionNoteOut?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create allocation record
      const allocation = await tx.assetAllocation.create({
        data: {
          assetId: data.assetId,
          allocatedToUserId: data.allocatedToUserId || null,
          allocatedToDepartmentId: data.allocatedToDepartmentId || null,
          allocatedById: data.allocatedById,
          expectedReturnDate: data.expectedReturnDate || null,
          conditionNoteOut: data.conditionNoteOut || null,
          status: 'ACTIVE',
        },
        include: {
          allocatedToUser: true,
          allocatedToDepartment: true,
        },
      });

      // 2. Update asset status
      await tx.asset.update({
        where: { id: data.assetId },
        data: { status: 'ALLOCATED' },
      });

      return allocation;
    });
  }

  async returnAllocation(id: string, data: { assetId: string; conditionNoteIn?: string | null }) {
    return prisma.$transaction(async (tx) => {
      // 1. Update allocation record
      const allocation = await tx.assetAllocation.update({
        where: { id },
        data: {
          status: 'RETURNED',
          actualReturnDate: new Date(),
          conditionNoteIn: data.conditionNoteIn || null,
        },
      });

      // 2. Update asset status
      await tx.asset.update({
        where: { id: data.assetId },
        data: { status: 'AVAILABLE' },
      });

      return allocation;
    });
  }

  async createTransferRequest(data: {
    assetId: string;
    fromAllocationId: string;
    requestedById: string;
    requestedToUserId?: string | null;
    requestedToDepartmentId?: string | null;
    sourceDepartmentId?: string | null;
    destinationDepartmentId?: string | null;
    requiresAssetManagerApproval: boolean;
  }) {
    return prisma.assetTransferRequest.create({
      data: {
        assetId: data.assetId,
        fromAllocationId: data.fromAllocationId,
        requestedById: data.requestedById,
        requestedToUserId: data.requestedToUserId || null,
        requestedToDepartmentId: data.requestedToDepartmentId || null,
        sourceDepartmentId: data.sourceDepartmentId || null,
        destinationDepartmentId: data.destinationDepartmentId || null,
        requiresAssetManagerApproval: data.requiresAssetManagerApproval,
        status: 'REQUESTED',
      },
      include: {
        requestedBy: true,
        asset: true,
      },
    });
  }

  async findTransferRequestById(id: string) {
    return prisma.assetTransferRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        fromAllocation: {
          include: {
            allocatedToUser: true,
            allocatedToDepartment: true,
          },
        },
        requestedBy: true,
        approvedBy: true,
      },
    });
  }

  async findAllTransferRequests(where: Prisma.AssetTransferRequestWhereInput, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.assetTransferRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          asset: true,
          requestedBy: true,
          approvedBy: true,
          fromAllocation: {
            include: {
              allocatedToUser: true,
              allocatedToDepartment: true,
            },
          },
        },
      }),
      prisma.assetTransferRequest.count({ where }),
    ]);

    return { items, total };
  }

  async approveTransferRequestTransaction(
    request: {
      id: string;
      assetId: string;
      fromAllocationId: string;
      requestedToUserId: string | null;
      requestedToDepartmentId: string | null;
    },
    callerId: string,
    notes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Mark the original allocation as TRANSFERRED
      await tx.assetAllocation.update({
        where: { id: request.fromAllocationId },
        data: {
          status: 'TRANSFERRED',
          actualReturnDate: new Date(),
        },
      });

      // 2. Mark the transfer request as APPROVED
      const approvedRequest = await tx.assetTransferRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          approvedById: callerId,
          notes: notes || null,
          resolvedAt: new Date(),
        },
      });

      // 3. Create a new ACTIVE allocation for the target user/department
      const newAllocation = await tx.assetAllocation.create({
        data: {
          assetId: request.assetId,
          allocatedToUserId: request.requestedToUserId || null,
          allocatedToDepartmentId: request.requestedToDepartmentId || null,
          allocatedById: callerId,
          status: 'ACTIVE',
        },
      });

      // 4. Update the asset status to ALLOCATED (redundant but ensures consistency)
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: 'ALLOCATED' },
      });

      return { approvedRequest, newAllocation };
    });
  }

  async rejectTransferRequest(id: string, callerId: string, notes?: string) {
    return prisma.assetTransferRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: callerId,
        notes: notes || null,
        resolvedAt: new Date(),
      },
    });
  }
}

export const allocationsRepository = new AllocationsRepository();
