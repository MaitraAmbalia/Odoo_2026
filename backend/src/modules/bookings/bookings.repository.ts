import { BookingStatus, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

export class BookingsRepository {
  async findConflictingBookings(
    assetId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ) {
    const where: Prisma.BookingWhereInput = {
      assetId,
      status: { not: 'CANCELLED' },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    return prisma.booking.findFirst({
      where,
      include: {
        bookedBy: true,
      },
    });
  }

  async createBooking(data: {
    assetId: string;
    bookedById: string;
    departmentId?: string | null;
    startTime: Date;
    endTime: Date;
  }) {
    return prisma.booking.create({
      data: {
        assetId: data.assetId,
        bookedById: data.bookedById,
        departmentId: data.departmentId || null,
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'UPCOMING',
      },
      include: {
        bookedBy: true,
        asset: true,
      },
    });
  }

  async getBookingById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        bookedBy: true,
        asset: true,
        department: true,
      },
    });
  }

  async findAllBookings(where: Prisma.BookingWhereInput, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: {
          bookedBy: true,
          asset: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, total };
  }

  async updateBookingStatus(id: string, status: BookingStatus, cancelReason?: string | null) {
    return prisma.booking.update({
      where: { id },
      data: {
        status,
        cancelReason: cancelReason || null,
      },
      include: {
        bookedBy: true,
        asset: true,
      },
    });
  }

  async rescheduleBooking(id: string, startTime: Date, endTime: Date) {
    return prisma.booking.update({
      where: { id },
      data: {
        startTime,
        endTime,
      },
      include: {
        bookedBy: true,
        asset: true,
      },
    });
  }

  async getAssetBookingsForCalendar(assetId: string) {
    return prisma.booking.findMany({
      where: {
        assetId,
        status: { not: 'CANCELLED' },
      },
      include: {
        bookedBy: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }
}

export const bookingsRepository = new BookingsRepository();
