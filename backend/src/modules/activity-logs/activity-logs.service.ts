import prisma from '../../config/prisma';

export class ActivityLogsService {
  async logAction(data: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: any;
  }) {
    return prisma.activityLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata || null,
      },
    });
  }
}

export const activityLogsService = new ActivityLogsService();
