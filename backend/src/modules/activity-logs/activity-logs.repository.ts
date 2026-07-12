import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class ActivityLogsRepository {
  async findAll(
    filters: {
      actorUserId?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    },
    skip: number,
    take: number
  ) {
    const where = this.buildWhereClause(filters);
    return prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async count(filters: {
    actorUserId?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where = this.buildWhereClause(filters);
    return prisma.activityLog.count({ where });
  }

  private buildWhereClause(filters: {
    actorUserId?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.ActivityLogWhereInput = {};

    if (filters.actorUserId) {
      where.userId = filters.actorUserId;
    }
    if (filters.entityType) {
      where.entityType = { contains: filters.entityType, mode: 'insensitive' };
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return where;
  }
}

export const activityLogsRepository = new ActivityLogsRepository();
export default activityLogsRepository;
