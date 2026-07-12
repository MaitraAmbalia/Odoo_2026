import prisma from '../../config/prisma';
import { activityLogsRepository } from './activity-logs.repository';

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

  async getAll(query: {
    actorUserId?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: string;
    limit?: string;
  }) {
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = parseInt(query.limit || '20', 10);

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const filters = {
      actorUserId: query.actorUserId,
      entityType: query.entityType,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    const [total, items] = await Promise.all([
      activityLogsRepository.count(filters),
      activityLogsRepository.findAll(filters, skip, take),
    ]);

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

export const activityLogsService = new ActivityLogsService();
export default activityLogsService;
