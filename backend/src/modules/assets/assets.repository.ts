import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class AssetsRepository {
  async findById(id: string) {
    return prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        documents: true,
        registeredBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findByTag(tag: string) {
    return prisma.asset.findUnique({
      where: { assetTag: tag },
      include: {
        category: true,
        documents: true,
      },
    });
  }

  async findBySerial(serialNumber: string) {
    return prisma.asset.findUnique({
      where: { serialNumber },
    });
  }

  async count(filters?: {
    tag?: string;
    serial?: string;
    category?: string;
    status?: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
    department?: string;
    location?: string;
  }) {
    const where = this.buildWhereClause(filters);
    return prisma.asset.count({ where });
  }

  async findAll(
    filters: {
      tag?: string;
      serial?: string;
      category?: string;
      status?: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
      department?: string;
      location?: string;
    },
    skip: number,
    take: number
  ) {
    const where = this.buildWhereClause(filters);
    return prisma.asset.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async create(data: {
    assetTag: string;
    name: string;
    categoryId: string;
    serialNumber?: string | null;
    acquisitionDate?: Date | null;
    acquisitionCost?: number | null;
    condition?: 'GOOD' | 'FAIR' | 'POOR';
    location?: string | null;
    isBookable?: boolean;
    status?: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
    qrCodeUrl?: string | null;
    registeredById: string;
    customFieldValues?: any;
    documents?: { fileUrl: string; fileType: 'photo' | 'invoice' | 'manual' }[];
  }) {
    const { documents, ...rest } = data;

    return prisma.asset.create({
      data: {
        ...rest,
        documents: documents
          ? {
              create: documents,
            }
          : undefined,
      },
      include: {
        category: true,
        documents: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      serialNumber?: string | null;
      acquisitionDate?: Date | null;
      acquisitionCost?: number | null;
      condition?: 'GOOD' | 'FAIR' | 'POOR';
      location?: string | null;
      isBookable?: boolean;
      status?: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
      customFieldValues?: any;
      documents?: { fileUrl: string; fileType: 'photo' | 'invoice' | 'manual' }[];
    }
  ) {
    const { documents, ...rest } = data;

    // If documents are updated, delete existing ones first within a transaction or directly.
    if (documents) {
      return prisma.$transaction(async (tx) => {
        await tx.assetDocument.deleteMany({
          where: { assetId: id },
        });

        return tx.asset.update({
          where: { id },
          data: {
            ...rest,
            documents: {
              create: documents,
            },
          },
          include: {
            category: true,
            documents: true,
          },
        });
      });
    }

    return prisma.asset.update({
      where: { id },
      data: rest,
      include: {
        category: true,
        documents: true,
      },
    });
  }

  async updateStatus(id: string, status: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED') {
    return prisma.asset.update({
      where: { id },
      data: { status },
    });
  }

  async getHistory(assetId: string) {
    const [allocations, maintenance] = await prisma.$transaction([
      prisma.assetAllocation.findMany({
        where: { assetId },
        include: {
          allocatedToUser: { select: { id: true, name: true, email: true } },
          allocatedToDepartment: { select: { id: true, name: true } },
          allocatedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.maintenanceRequest.findMany({
        where: { assetId },
        include: {
          raisedBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Merge and sort by date descending
    const historyList = [
      ...allocations.map((item) => ({
        id: item.id,
        type: 'allocation',
        date: item.createdAt,
        status: item.status,
        expectedReturnDate: item.expectedReturnDate,
        actualReturnDate: item.actualReturnDate,
        notes: item.conditionNoteOut,
        details: {
          allocatedToUser: item.allocatedToUser,
          allocatedToDepartment: item.allocatedToDepartment,
          allocatedBy: item.allocatedBy,
          conditionNoteIn: item.conditionNoteIn,
        },
      })),
      ...maintenance.map((item) => ({
        id: item.id,
        type: 'maintenance',
        date: item.createdAt,
        status: item.status,
        priority: item.priority,
        notes: item.issueDescription,
        details: {
          raisedBy: item.raisedBy,
          approvedBy: item.approvedBy,
          technicianName: item.technicianName,
          resolutionNotes: item.resolutionNotes,
          resolvedAt: item.resolvedAt,
        },
      })),
    ];

    return historyList.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private buildWhereClause(filters?: {
    tag?: string;
    serial?: string;
    category?: string;
    status?: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
    department?: string;
    location?: string;
  }) {
    const where: Prisma.AssetWhereInput = {};

    if (filters) {
      if (filters.tag) {
        where.assetTag = { contains: filters.tag, mode: 'insensitive' };
      }
      if (filters.serial) {
        where.serialNumber = { contains: filters.serial, mode: 'insensitive' };
      }
      if (filters.category) {
        // category filter could be name or ID, we support name contains or ID match
        where.OR = [
          { categoryId: filters.category },
          { category: { name: { contains: filters.category, mode: 'insensitive' } } },
        ];
      }
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.location) {
        where.location = { contains: filters.location, mode: 'insensitive' };
      }
      if (filters.department) {
        // Asset has department through active allocation
        where.allocations = {
          some: {
            allocatedToDepartmentId: filters.department,
            status: 'ACTIVE',
          },
        };
      }
    }

    return where;
  }
}

export const assetsRepository = new AssetsRepository();
export default assetsRepository;
