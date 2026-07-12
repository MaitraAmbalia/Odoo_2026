import { MaintenanceStatus, MaintenancePriority, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { maintenanceRepository } from './maintenance.repository';
import { notificationsService } from '../notifications/notifications.service';
import { activityLogsService } from '../activity-logs/activity-logs.service';
import { ApiError } from '../../common/ApiError';

export class MaintenanceService {
  async createRequest(
    raisedById: string,
    data: {
      assetId: string;
      issueDescription: string;
      priority: MaintenancePriority;
    },
    photoUrl?: string | null
  ) {
    // 1. Verify parent asset
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId },
    });

    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    if (asset.status === 'RETIRED' || asset.status === 'DISPOSED') {
      throw new ApiError(400, `Cannot raise maintenance request for asset in status ${asset.status}`);
    }

    // 2. Create request
    const request = await maintenanceRepository.createRequest({
      assetId: data.assetId,
      raisedById,
      issueDescription: data.issueDescription,
      priority: data.priority,
      photoUrl,
    });

    // 3. Log activity
    await activityLogsService.logAction({
      userId: raisedById,
      action: 'MAINTENANCE_REQUESTED',
      entityType: 'Asset',
      entityId: asset.id,
      metadata: { maintenanceRequestId: request.id },
    });

    return request;
  }

  async approveRequest(id: string, approverId: string) {
    const request = await maintenanceRepository.getRequestById(id);

    if (!request) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    if (request.status !== 'PENDING') {
      throw new ApiError(400, `Cannot approve maintenance request in status ${request.status}`);
    }

    const approvedRequest = await maintenanceRepository.approveRequestTransaction(
      id,
      approverId,
      request.assetId
    );

    // Send notification to requester
    try {
      await notificationsService.createNotification({
        userId: request.raisedById,
        type: 'MAINTENANCE_APPROVED',
        message: `Your maintenance request for Asset "${request.asset?.name}" has been approved.`,
        relatedEntityType: 'MaintenanceRequest',
        relatedEntityId: request.id,
      });
    } catch (error) {
      console.error('Failed to send maintenance approval notification:', error);
    }

    // Log activity
    await activityLogsService.logAction({
      userId: approverId,
      action: 'MAINTENANCE_APPROVED',
      entityType: 'MaintenanceRequest',
      entityId: id,
      metadata: { assetId: request.assetId },
    });

    return approvedRequest;
  }

  async rejectRequest(id: string, approverId: string) {
    const request = await maintenanceRepository.getRequestById(id);

    if (!request) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    if (request.status !== 'PENDING') {
      throw new ApiError(400, `Cannot reject maintenance request in status ${request.status}`);
    }

    const rejectedRequest = await maintenanceRepository.rejectRequest(id, approverId);

    // Send notification to requester
    try {
      await notificationsService.createNotification({
        userId: request.raisedById,
        type: 'MAINTENANCE_REJECTED',
        message: `Your maintenance request for Asset "${request.asset?.name}" has been rejected.`,
        relatedEntityType: 'MaintenanceRequest',
        relatedEntityId: request.id,
      });
    } catch (error) {
      console.error('Failed to send maintenance rejection notification:', error);
    }

    // Log activity
    await activityLogsService.logAction({
      userId: approverId,
      action: 'MAINTENANCE_REJECTED',
      entityType: 'MaintenanceRequest',
      entityId: id,
      metadata: { assetId: request.assetId },
    });

    return rejectedRequest;
  }

  async assignTechnician(id: string, approverId: string, technicianName: string) {
    const request = await maintenanceRepository.getRequestById(id);

    if (!request) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    if (request.status !== 'APPROVED' && request.status !== 'TECHNICIAN_ASSIGNED') {
      throw new ApiError(400, `Cannot assign technician to maintenance request in status ${request.status}`);
    }

    const updatedRequest = await maintenanceRepository.assignTechnician(id, technicianName);

    // Log activity
    await activityLogsService.logAction({
      userId: approverId,
      action: 'MAINTENANCE_TECHNICIAN_ASSIGNED',
      entityType: 'MaintenanceRequest',
      entityId: id,
      metadata: { technicianName },
    });

    return updatedRequest;
  }

  async startRequest(id: string, approverId: string) {
    const request = await maintenanceRepository.getRequestById(id);

    if (!request) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    if (request.status !== 'APPROVED' && request.status !== 'TECHNICIAN_ASSIGNED') {
      throw new ApiError(400, `Cannot start maintenance request in status ${request.status}`);
    }

    const updatedRequest = await maintenanceRepository.updateRequestStatus(id, 'IN_PROGRESS');

    // Log activity
    await activityLogsService.logAction({
      userId: approverId,
      action: 'MAINTENANCE_STARTED',
      entityType: 'MaintenanceRequest',
      entityId: id,
    });

    return updatedRequest;
  }

  async resolveRequest(id: string, approverId: string, resolutionNotes: string) {
    const request = await maintenanceRepository.getRequestById(id);

    if (!request) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    if (request.status !== 'IN_PROGRESS') {
      throw new ApiError(400, `Cannot resolve maintenance request in status ${request.status}`);
    }

    const resolvedRequest = await maintenanceRepository.resolveRequestTransaction(
      id,
      request.assetId,
      resolutionNotes
    );

    // Notify requester
    try {
      await notificationsService.createNotification({
        userId: request.raisedById,
        type: 'MAINTENANCE_APPROVED', // Or generic notify type
        message: `Your maintenance request for Asset "${request.asset?.name}" has been resolved.`,
        relatedEntityType: 'MaintenanceRequest',
        relatedEntityId: request.id,
      });
    } catch (error) {
      console.error('Failed to send maintenance resolution notification:', error);
    }

    // Log activity
    await activityLogsService.logAction({
      userId: approverId,
      action: 'MAINTENANCE_RESOLVED',
      entityType: 'MaintenanceRequest',
      entityId: id,
      metadata: { resolutionNotes, assetId: request.assetId },
    });

    return resolvedRequest;
  }

  async getRequestDetail(id: string) {
    const request = await maintenanceRepository.getRequestById(id);
    if (!request) {
      throw new ApiError(404, 'Maintenance request not found');
    }
    return request;
  }

  async listRequests(
    caller: { id: string; role: string },
    pagination: { page: number; limit: number }
  ) {
    const where: Prisma.MaintenanceRequestWhereInput = {};

    // Scoped filters
    if (caller.role !== 'ADMIN' && caller.role !== 'ASSET_MANAGER') {
      where.raisedById = caller.id;
    }

    return maintenanceRepository.findAllRequests(where, pagination);
  }
}

export const maintenanceService = new MaintenanceService();
