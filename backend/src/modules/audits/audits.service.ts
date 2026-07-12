import { AuditCycleStatus, AuditItemResult, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { auditsRepository } from './audits.repository';
import { notificationsService } from '../notifications/notifications.service';
import { activityLogsService } from '../activity-logs/activity-logs.service';
import { ApiError } from '../../common/ApiError';

export class AuditsService {
  async createCycle(
    createdById: string,
    data: {
      name: string;
      scopeDepartmentId?: string;
      scopeLocation?: string;
      startDate: Date;
      endDate: Date;
      auditorUserIds: string[];
    }
  ) {
    // 1. Resolve assets in the scope
    const whereAsset: Prisma.AssetWhereInput = {
      status: { notIn: ['RETIRED', 'DISPOSED'] },
    };

    if (data.scopeLocation) {
      whereAsset.location = data.scopeLocation;
    }

    if (data.scopeDepartmentId) {
      whereAsset.allocations = {
        some: {
          status: 'ACTIVE',
          OR: [
            { allocatedToDepartmentId: data.scopeDepartmentId },
            { allocatedToUser: { departmentId: data.scopeDepartmentId } },
          ],
        },
      };
    }

    const scopedAssets = await prisma.asset.findMany({
      where: whereAsset,
      select: { id: true },
    });

    // 2. Create the cycle, auditors, and snapshot items inside a transaction
    const cycle = await auditsRepository.createAuditCycleTransaction(
      {
        name: data.name,
        scopeDepartmentId: data.scopeDepartmentId,
        scopeLocation: data.scopeLocation,
        startDate: data.startDate,
        endDate: data.endDate,
        createdById,
        auditorUserIds: data.auditorUserIds,
      },
      scopedAssets
    );

    // 3. Log activity
    await activityLogsService.logAction({
      userId: createdById,
      action: 'AUDIT_CYCLE_CREATED',
      entityType: 'AuditCycle',
      entityId: cycle.id,
      metadata: { scopedAssetsCount: scopedAssets.length },
    });

    return cycle;
  }

  async verifyItem(
    itemId: string,
    cycleId: string,
    verifier: { id: string; role: string },
    data: { result: AuditItemResult; notes?: string }
  ) {
    // 1. Find audit item
    const item = await auditsRepository.findAuditItemById(itemId);
    if (!item) {
      throw new ApiError(404, 'Audit item not found');
    }

    if (item.auditCycleId !== cycleId) {
      throw new ApiError(400, 'Audit item does not belong to the specified audit cycle');
    }

    if (item.auditCycle.status !== 'IN_PROGRESS') {
      throw new ApiError(400, 'Audit cycle is not in progress');
    }

    // 2. Access control: Admin or assigned auditor
    const isAdmin = verifier.role === 'ADMIN';
    const isAssigned = await auditsRepository.isAuditorAssigned(cycleId, verifier.id);

    if (!isAdmin && !isAssigned) {
      throw new ApiError(403, 'You are not authorized to verify items in this audit cycle');
    }

    // 3. Verify item
    const updatedItem = await auditsRepository.verifyAuditItem(itemId, verifier.id, data.result, data.notes);

    // 4. Side effects: raising discrepancy reports
    if (data.result === 'MISSING' || data.result === 'DAMAGED') {
      // Create activity log entry to represent the discrepancy report
      await activityLogsService.logAction({
        userId: verifier.id,
        action: 'AUDIT_DISCREPANCY_REPORTED',
        entityType: 'AuditItem',
        entityId: itemId,
        metadata: {
          auditCycleId: cycleId,
          assetId: item.assetId,
          result: data.result,
          notes: data.notes,
        },
      });

      // Send AUDIT_DISCREPANCY notification to all Asset Managers
      try {
        const managers = await prisma.user.findMany({
          where: { role: 'ASSET_MANAGER', status: 'ACTIVE' },
        });

        for (const manager of managers) {
          await notificationsService.createNotification({
            userId: manager.id,
            type: 'AUDIT_DISCREPANCY',
            message: `Discrepancy reported: Asset "${updatedItem.asset?.name}" was verified as ${data.result} during audit "${item.auditCycle.name}".`,
            relatedEntityType: 'AuditItem',
            relatedEntityId: itemId,
          });
        }
      } catch (error) {
        console.error('Failed to dispatch discrepancy notifications:', error);
      }
    }

    // Log verification action
    await activityLogsService.logAction({
      userId: verifier.id,
      action: 'AUDIT_ITEM_VERIFIED',
      entityType: 'AuditItem',
      entityId: itemId,
      metadata: { result: data.result },
    });

    return updatedItem;
  }

  async closeCycle(id: string, callerId: string) {
    const cycle = await auditsRepository.getCycleById(id);

    if (!cycle) {
      throw new ApiError(404, 'Audit cycle not found');
    }

    if (cycle.status === 'CLOSED') {
      throw new ApiError(400, 'Audit cycle is already closed');
    }

    // Find missing items to mark assets as LOST
    const missingItems = cycle.items.filter((item) => item.result === 'MISSING');
    const missingAssetIds = missingItems.map((item) => item.assetId);

    const closedCycle = await auditsRepository.closeAuditCycleTransaction(id, missingAssetIds);

    // Log action
    await activityLogsService.logAction({
      userId: callerId,
      action: 'AUDIT_CYCLE_CLOSED',
      entityType: 'AuditCycle',
      entityId: id,
      metadata: { lostAssetsCount: missingAssetIds.length },
    });

    return closedCycle;
  }

  async getDiscrepancies(id: string) {
    const cycle = await prisma.auditCycle.findUnique({ where: { id } });
    if (!cycle) {
      throw new ApiError(404, 'Audit cycle not found');
    }

    return auditsRepository.findDiscrepancies(id);
  }

  async getCycleDetail(id: string, caller: { id: string; role: string }) {
    const cycle = await auditsRepository.getCycleById(id);
    if (!cycle) {
      throw new ApiError(404, 'Audit cycle not found');
    }

    // Access check: Admin, Manager, or assigned auditor
    const isManager = caller.role === 'ADMIN' || caller.role === 'ASSET_MANAGER';
    const isAssigned = await auditsRepository.isAuditorAssigned(id, caller.id);

    if (!isManager && !isAssigned) {
      throw new ApiError(403, 'You do not have permission to view this audit cycle');
    }

    return cycle;
  }

  async listCycles(
    caller: { id: string; role: string },
    pagination: { page: number; limit: number }
  ) {
    const where: Prisma.AuditCycleWhereInput = {};

    // Scoped filtering: Non-managers only see cycles they are assigned to
    if (caller.role !== 'ADMIN' && caller.role !== 'ASSET_MANAGER') {
      where.auditors = {
        some: { auditorId: caller.id },
      };
    }

    return auditsRepository.findAllCycles(where, pagination);
  }
}

export const auditsService = new AuditsService();
