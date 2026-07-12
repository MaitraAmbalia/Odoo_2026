import { AllocationStatus, TransferStatus, AssetStatus, Prisma, UserRole } from '@prisma/client';
import prisma from '../../config/prisma';
import { allocationsRepository } from './allocations.repository';
import { notificationsService } from '../notifications/notifications.service';
import { activityLogsService } from '../activity-logs/activity-logs.service';
import { ApiError } from '../../common/ApiError';

export class AllocationsService {
  async allocateAsset(
    callerId: string,
    data: {
      assetId: string;
      allocatedToUserId?: string;
      allocatedToDepartmentId?: string;
      expectedReturnDate?: Date;
      conditionNoteOut?: string;
    }
  ) {
    // 1. Verify asset existence and status
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId },
    });

    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    if (asset.status === 'RETIRED' || asset.status === 'DISPOSED') {
      throw new ApiError(400, `Cannot allocate asset in status ${asset.status}`);
    }

    // 2. Conflict check: verify if the asset has an active allocation
    const activeAlloc = await allocationsRepository.findActiveAllocationByAssetId(data.assetId);
    if (activeAlloc) {
      const holderName =
        activeAlloc.allocatedToUser?.name ||
        activeAlloc.allocatedToDepartment?.name ||
        'Department';
      throw new ApiError(409, 'Asset is currently allocated', [
        { currentHolder: holderName, suggestTransfer: true },
      ]);
    }

    // 3. Verify recipient existence
    if (data.allocatedToUserId) {
      const user = await prisma.user.findUnique({ where: { id: data.allocatedToUserId } });
      if (!user) {
        throw new ApiError(404, 'User not found');
      }
    } else if (data.allocatedToDepartmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.allocatedToDepartmentId } });
      if (!dept) {
        throw new ApiError(404, 'Department not found');
      }
    }

    // 4. Create allocation
    const allocation = await allocationsRepository.createAllocation({
      assetId: data.assetId,
      allocatedToUserId: data.allocatedToUserId,
      allocatedToDepartmentId: data.allocatedToDepartmentId,
      allocatedById: callerId,
      expectedReturnDate: data.expectedReturnDate,
      conditionNoteOut: data.conditionNoteOut,
    });

    // 5. Notify recipient
    try {
      if (allocation.allocatedToUserId) {
        await notificationsService.createNotification({
          userId: allocation.allocatedToUserId,
          type: 'ASSET_ASSIGNED',
          message: `Asset "${asset.name}" (${asset.assetTag}) has been allocated to you.`,
          relatedEntityType: 'AssetAllocation',
          relatedEntityId: allocation.id,
        });
      } else if (allocation.allocatedToDepartmentId && allocation.allocatedToDepartment?.headUserId) {
        await notificationsService.createNotification({
          userId: allocation.allocatedToDepartment.headUserId,
          type: 'ASSET_ASSIGNED',
          message: `Asset "${asset.name}" (${asset.assetTag}) has been allocated to your department: ${allocation.allocatedToDepartment.name}.`,
          relatedEntityType: 'AssetAllocation',
          relatedEntityId: allocation.id,
        });
      }
    } catch (error) {
      console.error('Failed to send notification for asset allocation:', error);
    }

    // 6. Log activity
    await activityLogsService.logAction({
      userId: callerId,
      action: 'ALLOCATED',
      entityType: 'Asset',
      entityId: asset.id,
      metadata: { allocationId: allocation.id },
    });

    return allocation;
  }

  async returnAllocation(
    id: string,
    caller: { id: string; role: string; departmentId: string | null },
    data: { returnConditionNotes?: string }
  ) {
    const allocation = await allocationsRepository.findAllocationById(id);

    if (!allocation) {
      throw new ApiError(404, 'Allocation not found');
    }

    if (allocation.status !== 'ACTIVE' && allocation.status !== 'OVERDUE') {
      throw new ApiError(400, 'Allocation is not active');
    }

    // Authorization check: ADMIN, ASSET_MANAGER, or the allocation holder/dept head
    const isManager = caller.role === 'ADMIN' || caller.role === 'ASSET_MANAGER';
    const isUserHolder = allocation.allocatedToUserId === caller.id;
    const isDeptHeadHolder =
      allocation.allocatedToDepartmentId &&
      caller.role === 'DEPARTMENT_HEAD' &&
      allocation.allocatedToDepartment?.headUserId === caller.id;

    if (!isManager && !isUserHolder && !isDeptHeadHolder) {
      throw new ApiError(403, 'You do not have permission to return this allocation');
    }

    const updatedAllocation = await allocationsRepository.returnAllocation(id, {
      assetId: allocation.assetId,
      conditionNoteIn: data.returnConditionNotes,
    });

    // Log action
    await activityLogsService.logAction({
      userId: caller.id,
      action: 'RETURNED',
      entityType: 'Asset',
      entityId: allocation.assetId,
      metadata: { allocationId: allocation.id },
    });

    return updatedAllocation;
  }

  async createTransferRequest(
    allocationId: string,
    caller: { id: string; role: string; departmentId: string | null },
    data: { requestedToUserId?: string; requestedToDepartmentId?: string }
  ) {
    const allocation = await allocationsRepository.findAllocationById(allocationId);

    if (!allocation) {
      throw new ApiError(404, 'Allocation not found');
    }

    if (allocation.status !== 'ACTIVE' && allocation.status !== 'OVERDUE') {
      throw new ApiError(400, 'Allocation is not active or overdue, cannot request transfer');
    }

    // Access check: holder, dept head of holder's dept, ADMIN, or ASSET_MANAGER
    const isManager = caller.role === 'ADMIN' || caller.role === 'ASSET_MANAGER';
    const isUserHolder = allocation.allocatedToUserId === caller.id;
    const isDeptHeadHolder =
      allocation.allocatedToDepartmentId &&
      caller.role === 'DEPARTMENT_HEAD' &&
      allocation.allocatedToDepartment?.headUserId === caller.id;

    if (!isManager && !isUserHolder && !isDeptHeadHolder) {
      throw new ApiError(403, 'Only the current holder, their Department Head, or an Asset Manager can request a transfer');
    }

    // Verify recipient existence
    let targetUser: any = null;
    let targetDept: any = null;

    if (data.requestedToUserId) {
      targetUser = await prisma.user.findUnique({ where: { id: data.requestedToUserId } });
      if (!targetUser) {
        throw new ApiError(404, 'Target user not found');
      }
    } else if (data.requestedToDepartmentId) {
      targetDept = await prisma.department.findUnique({ where: { id: data.requestedToDepartmentId } });
      if (!targetDept) {
        throw new ApiError(404, 'Target department not found');
      }
    }

    // Compute Source Department
    let sourceDepartmentId: string | null = null;
    if (allocation.allocatedToUserId) {
      const user = await prisma.user.findUnique({ where: { id: allocation.allocatedToUserId } });
      sourceDepartmentId = user?.departmentId || null;
    } else {
      sourceDepartmentId = allocation.allocatedToDepartmentId;
    }

    // Compute Destination Department
    let destinationDepartmentId: string | null = null;
    if (data.requestedToUserId) {
      destinationDepartmentId = targetUser.departmentId || null;
    } else {
      destinationDepartmentId = data.requestedToDepartmentId || null;
    }

    // resolveApprover Logic
    const requiresAssetManagerApproval =
      !sourceDepartmentId ||
      !destinationDepartmentId ||
      sourceDepartmentId !== destinationDepartmentId;

    const request = await allocationsRepository.createTransferRequest({
      assetId: allocation.assetId,
      fromAllocationId: allocation.id,
      requestedById: caller.id,
      requestedToUserId: data.requestedToUserId,
      requestedToDepartmentId: data.requestedToDepartmentId,
      sourceDepartmentId,
      destinationDepartmentId,
      requiresAssetManagerApproval,
    });

    // Notify approver
    try {
      if (requiresAssetManagerApproval) {
        // Notify all Asset Managers
        const managers = await prisma.user.findMany({
          where: { role: 'ASSET_MANAGER', status: 'ACTIVE' },
        });
        for (const manager of managers) {
          await notificationsService.createNotification({
            userId: manager.id,
            type: 'TRANSFER_APPROVED', // We use approved or requests? Transfer requests doesn't have custom notification type other than TRANSFER_APPROVED, but let's notify them
            message: `New transfer request raised for Asset "${allocation.asset?.name}". Requires Asset Manager approval.`,
            relatedEntityType: 'AssetTransferRequest',
            relatedEntityId: request.id,
          });
        }
      } else if (sourceDepartmentId) {
        // Notify department head
        const dept = await prisma.department.findUnique({ where: { id: sourceDepartmentId } });
        if (dept?.headUserId) {
          await notificationsService.createNotification({
            userId: dept.headUserId,
            type: 'TRANSFER_APPROVED',
            message: `New internal transfer request raised for Asset "${allocation.asset?.name}" in your department.`,
            relatedEntityType: 'AssetTransferRequest',
            relatedEntityId: request.id,
          });
        }
      }
    } catch (error) {
      console.error('Failed to notify approvers for transfer request:', error);
    }

    // Log action
    await activityLogsService.logAction({
      userId: caller.id,
      action: 'TRANSFER_REQUESTED',
      entityType: 'AssetTransferRequest',
      entityId: request.id,
      metadata: { allocationId: allocation.id },
    });

    return request;
  }

  async approveTransferRequest(
    id: string,
    caller: { id: string; role: string; departmentId: string | null },
    notes?: string
  ) {
    const request = await allocationsRepository.findTransferRequestById(id);

    if (!request) {
      throw new ApiError(404, 'Transfer request not found');
    }

    if (request.status !== 'REQUESTED') {
      throw new ApiError(400, `Transfer request has already been ${request.status.toLowerCase()}`);
    }

    // Scoped approval checks
    if (request.requiresAssetManagerApproval) {
      if (caller.role !== 'ADMIN' && caller.role !== 'ASSET_MANAGER') {
        throw new ApiError(403, 'Only Asset Managers or Admins can approve cross-department transfers');
      }
    } else {
      const isManager = caller.role === 'ADMIN' || caller.role === 'ASSET_MANAGER';
      const isSourceDeptHead =
        caller.role === 'DEPARTMENT_HEAD' &&
        request.sourceDepartmentId === caller.departmentId;

      if (!isManager && !isSourceDeptHead) {
        throw new ApiError(403, 'Only the Department Head or an Asset Manager can approve this transfer');
      }
    }

    const { approvedRequest, newAllocation } = await allocationsRepository.approveTransferRequestTransaction(
      request,
      caller.id,
      notes
    );

    // Notify requester and recipient
    try {
      await notificationsService.createNotification({
        userId: request.requestedById,
        type: 'TRANSFER_APPROVED',
        message: `Your transfer request for Asset "${request.asset?.name}" has been approved.`,
        relatedEntityType: 'AssetTransferRequest',
        relatedEntityId: request.id,
      });

      if (request.requestedToUserId) {
        await notificationsService.createNotification({
          userId: request.requestedToUserId,
          type: 'ASSET_ASSIGNED',
          message: `Asset "${request.asset?.name}" has been transferred to you.`,
          relatedEntityType: 'AssetAllocation',
          relatedEntityId: newAllocation.id,
        });
      } else if (request.requestedToDepartmentId) {
        const dept = await prisma.department.findUnique({ where: { id: request.requestedToDepartmentId } });
        if (dept?.headUserId) {
          await notificationsService.createNotification({
            userId: dept.headUserId,
            type: 'ASSET_ASSIGNED',
            message: `Asset "${request.asset?.name}" has been transferred to your department: ${dept.name}.`,
            relatedEntityType: 'AssetAllocation',
            relatedEntityId: newAllocation.id,
          });
        }
      }
    } catch (error) {
      console.error('Failed to notify parties for transfer approval:', error);
    }

    // Log action
    await activityLogsService.logAction({
      userId: caller.id,
      action: 'TRANSFER_APPROVED',
      entityType: 'AssetTransferRequest',
      entityId: request.id,
      metadata: { newAllocationId: newAllocation.id },
    });

    return approvedRequest;
  }

  async rejectTransferRequest(
    id: string,
    caller: { id: string; role: string; departmentId: string | null },
    notes?: string
  ) {
    const request = await allocationsRepository.findTransferRequestById(id);

    if (!request) {
      throw new ApiError(404, 'Transfer request not found');
    }

    if (request.status !== 'REQUESTED') {
      throw new ApiError(400, `Transfer request has already been ${request.status.toLowerCase()}`);
    }

    // Scoped approval checks (same as approve)
    if (request.requiresAssetManagerApproval) {
      if (caller.role !== 'ADMIN' && caller.role !== 'ASSET_MANAGER') {
        throw new ApiError(403, 'Only Asset Managers or Admins can reject cross-department transfers');
      }
    } else {
      const isManager = caller.role === 'ADMIN' || caller.role === 'ASSET_MANAGER';
      const isSourceDeptHead =
        caller.role === 'DEPARTMENT_HEAD' &&
        request.sourceDepartmentId === caller.departmentId;

      if (!isManager && !isSourceDeptHead) {
        throw new ApiError(403, 'Only the Department Head or an Asset Manager can reject this transfer');
      }
    }

    const rejectedRequest = await allocationsRepository.rejectTransferRequest(id, caller.id, notes);

    // Notify requester
    try {
      await notificationsService.createNotification({
        userId: request.requestedById,
        type: 'MAINTENANCE_REJECTED', // Or custom rejection type? TRANSFER_REJECTED doesn't exist, we use generic or match enums. Let's send a generic notification using existing enums
        message: `Your transfer request for Asset "${request.asset?.name}" has been rejected.`,
        relatedEntityType: 'AssetTransferRequest',
        relatedEntityId: request.id,
      });
    } catch (error) {
      console.error('Failed to notify requester for transfer rejection:', error);
    }

    // Log action
    await activityLogsService.logAction({
      userId: caller.id,
      action: 'TRANSFER_REJECTED',
      entityType: 'AssetTransferRequest',
      entityId: request.id,
    });

    return rejectedRequest;
  }

  async getAllocations(
    caller: { id: string; role: string; departmentId: string | null },
    query: { page: number; limit: number }
  ) {
    const where: Prisma.AssetAllocationWhereInput = {};

    // Scoped filters
    if (caller.role !== 'ADMIN' && caller.role !== 'ASSET_MANAGER') {
      if (caller.role === 'DEPARTMENT_HEAD' && caller.departmentId) {
        where.OR = [
          { allocatedToDepartmentId: caller.departmentId },
          { allocatedToUser: { departmentId: caller.departmentId } },
        ];
      } else {
        where.allocatedToUserId = caller.id;
      }
    }

    return allocationsRepository.findAllAllocations(where, query);
  }

  async getTransferRequests(
    caller: { id: string; role: string; departmentId: string | null },
    query: { page: number; limit: number }
  ) {
    const where: Prisma.AssetTransferRequestWhereInput = {};

    // Scoped filters
    if (caller.role !== 'ADMIN' && caller.role !== 'ASSET_MANAGER') {
      if (caller.role === 'DEPARTMENT_HEAD' && caller.departmentId) {
        where.OR = [
          { sourceDepartmentId: caller.departmentId },
          { destinationDepartmentId: caller.departmentId },
          { requestedBy: { departmentId: caller.departmentId } },
        ];
      } else {
        where.OR = [
          { requestedById: caller.id },
          { requestedToUserId: caller.id },
        ];
      }
    }

    return allocationsRepository.findAllTransferRequests(where, query);
  }
}

export const allocationsService = new AllocationsService();
