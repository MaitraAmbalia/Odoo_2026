import { AuditCycleStatus, AuditItemResult, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class AuditsRepository {
  async createAuditCycleTransaction(
    data: {
      name: string;
      scopeDepartmentId?: string | null;
      scopeLocation?: string | null;
      startDate: Date;
      endDate: Date;
      createdById: string;
      auditorUserIds: string[];
    },
    assets: { id: string }[]
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the AuditCycle
      const cycle = await tx.auditCycle.create({
        data: {
          name: data.name,
          scopeDepartmentId: data.scopeDepartmentId || null,
          scopeLocation: data.scopeLocation || null,
          startDate: data.startDate,
          endDate: data.endDate,
          createdById: data.createdById,
          status: 'IN_PROGRESS',
        },
      });

      // 2. Link Auditors
      if (data.auditorUserIds.length > 0) {
        const auditorsData = data.auditorUserIds.map((auditorId) => ({
          auditCycleId: cycle.id,
          auditorId,
        }));
        await tx.auditCycleAuditor.createMany({
          data: auditorsData,
        });
      }

      // 3. Create AuditItems for each scoped asset
      if (assets.length > 0) {
        const itemsData = assets.map((asset) => ({
          auditCycleId: cycle.id,
          assetId: asset.id,
          result: 'PENDING' as AuditItemResult,
        }));
        await tx.auditItem.createMany({
          data: itemsData,
        });
      }

      return cycle;
    });
  }

  async getCycleById(id: string) {
    return prisma.auditCycle.findUnique({
      where: { id },
      include: {
        auditors: {
          include: {
            auditor: true,
          },
        },
        items: {
          include: {
            asset: true,
            verifiedBy: true,
          },
        },
        createdBy: true,
        scopeDepartment: true,
      },
    });
  }

  async findAllCycles(where: Prisma.AuditCycleWhereInput, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.auditCycle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: true,
          scopeDepartment: true,
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.auditCycle.count({ where }),
    ]);

    return { items, total };
  }

  async findAuditItemById(id: string) {
    return prisma.auditItem.findUnique({
      where: { id },
      include: {
        asset: true,
        auditCycle: true,
      },
    });
  }

  async isAuditorAssigned(auditCycleId: string, auditorId: string) {
    const assigned = await prisma.auditCycleAuditor.findUnique({
      where: {
        auditCycleId_auditorId: {
          auditCycleId,
          auditorId,
        },
      },
    });
    return !!assigned;
  }

  async verifyAuditItem(id: string, verifiedById: string, result: AuditItemResult, notes?: string | null) {
    return prisma.auditItem.update({
      where: { id },
      data: {
        result,
        notes: notes || null,
        verifiedById,
        verifiedAt: new Date(),
      },
      include: {
        asset: true,
        auditCycle: true,
      },
    });
  }

  async closeAuditCycleTransaction(id: string, missingAssetIds: string[]) {
    return prisma.$transaction(async (tx) => {
      // 1. Update cycle status to CLOSED
      const cycle = await tx.auditCycle.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      // 2. Set status of missing assets to LOST
      if (missingAssetIds.length > 0) {
        await tx.asset.updateMany({
          where: { id: { in: missingAssetIds } },
          data: { status: 'LOST' },
        });
      }

      return cycle;
    });
  }

  async findDiscrepancies(auditCycleId: string) {
    return prisma.auditItem.findMany({
      where: {
        auditCycleId,
        result: { in: ['MISSING', 'DAMAGED'] },
      },
      include: {
        asset: true,
        verifiedBy: true,
      },
      orderBy: { verifiedAt: 'desc' },
    });
  }
}

export const auditsRepository = new AuditsRepository();
