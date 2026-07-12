import { BookingStatus, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { bookingsRepository } from './bookings.repository';
import { notificationsService } from '../notifications/notifications.service';
import { activityLogsService } from '../activity-logs/activity-logs.service';
import { emitBookingUpdate } from '../../config/socket';
import { ApiError } from '../../common/ApiError';

export class BookingsService {
  async createBooking(
    bookedById: string,
    data: {
      assetId: string;
      startTime: Date;
      endTime: Date;
      departmentId?: string;
    }
  ) {
    // 1. Verify asset existence and bookable rules
    const asset = await prisma.asset.findUnique({
      where: { id: data.assetId },
    });

    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    if (!asset.isBookable) {
      throw new ApiError(400, 'Asset is not configured as bookable');
    }

    if (asset.status !== 'AVAILABLE') {
      throw new ApiError(400, `Asset is currently not available for booking (Status: ${asset.status})`);
    }

    // 2. Validate startTime is in the future
    if (data.startTime < new Date()) {
      throw new ApiError(400, 'Booking start time cannot be in the past');
    }

    // 3. Overlap check
    const conflict = await bookingsRepository.findConflictingBookings(
      data.assetId,
      data.startTime,
      data.endTime
    );

    if (conflict) {
      throw new ApiError(409, 'Asset is already booked during this time period', [
        {
          conflictUser: conflict.bookedBy.name,
          conflictStartTime: conflict.startTime.toISOString(),
        },
      ]);
    }

    // 4. Create booking
    const booking = await bookingsRepository.createBooking({
      assetId: data.assetId,
      bookedById,
      departmentId: data.departmentId,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    // 5. Send notification to booker
    try {
      await notificationsService.createNotification({
        userId: bookedById,
        type: 'BOOKING_CONFIRMED',
        message: `Your booking for Asset "${asset.name}" starting at ${data.startTime.toLocaleString()} is confirmed.`,
        relatedEntityType: 'Booking',
        relatedEntityId: booking.id,
      });
    } catch (error) {
      console.error('Failed to send booking confirmation notification:', error);
    }

    // 6. Emit socket update
    try {
      emitBookingUpdate(data.assetId);
    } catch (error) {
      console.error('Failed to emit socket update for booking:', error);
    }

    // 7. Log activity
    await activityLogsService.logAction({
      userId: bookedById,
      action: 'BOOKED',
      entityType: 'Asset',
      entityId: asset.id,
      metadata: { bookingId: booking.id },
    });

    return booking;
  }

  async cancelBooking(
    id: string,
    caller: { id: string; role: string },
    data: { cancelReason?: string }
  ) {
    const booking = await bookingsRepository.getBookingById(id);

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new ApiError(400, `Cannot cancel booking because it is already ${booking.status.toLowerCase()}`);
    }

    // Enforce access control: booker, ADMIN, ASSET_MANAGER only
    const isManager = caller.role === 'ADMIN' || caller.role === 'ASSET_MANAGER';
    const isBooker = booking.bookedById === caller.id;

    if (!isManager && !isBooker) {
      throw new ApiError(403, 'You are not authorized to cancel this booking');
    }

    const cancelledBooking = await bookingsRepository.updateBookingStatus(
      id,
      'CANCELLED',
      data.cancelReason
    );

    // Send notification
    try {
      await notificationsService.createNotification({
        userId: booking.bookedById,
        type: 'BOOKING_CANCELLED',
        message: `Your booking for Asset "${booking.asset?.name}" starting at ${booking.startTime.toLocaleString()} has been cancelled.`,
        relatedEntityType: 'Booking',
        relatedEntityId: booking.id,
      });
    } catch (error) {
      console.error('Failed to send booking cancellation notification:', error);
    }

    // Emit socket update
    try {
      emitBookingUpdate(booking.assetId);
    } catch (error) {
      console.error('Failed to emit socket update for booking cancellation:', error);
    }

    // Log activity
    await activityLogsService.logAction({
      userId: caller.id,
      action: 'BOOKING_CANCELLED',
      entityType: 'Booking',
      entityId: booking.id,
      metadata: { assetId: booking.assetId, cancelReason: data.cancelReason },
    });

    return cancelledBooking;
  }

  async rescheduleBooking(
    id: string,
    caller: { id: string },
    data: { startTime: Date; endTime: Date }
  ) {
    const booking = await bookingsRepository.getBookingById(id);

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.status !== 'UPCOMING') {
      throw new ApiError(400, `Cannot reschedule booking because it is in status ${booking.status.toLowerCase()}`);
    }

    // Access control: only the original booker can reschedule
    if (booking.bookedById !== caller.id) {
      throw new ApiError(403, 'Only the user who booked the resource can reschedule it');
    }

    // Validate startTime is in the future
    if (data.startTime < new Date()) {
      throw new ApiError(400, 'Rescheduled start time cannot be in the past');
    }

    // Overlap check
    const conflict = await bookingsRepository.findConflictingBookings(
      booking.assetId,
      data.startTime,
      data.endTime,
      booking.id
    );

    if (conflict) {
      throw new ApiError(409, 'Asset is already booked during this time period', [
        {
          conflictUser: conflict.bookedBy.name,
          conflictStartTime: conflict.startTime.toISOString(),
        },
      ]);
    }

    const rescheduledBooking = await bookingsRepository.rescheduleBooking(
      id,
      data.startTime,
      data.endTime
    );

    // Emit socket update
    try {
      emitBookingUpdate(booking.assetId);
    } catch (error) {
      console.error('Failed to emit socket update for booking reschedule:', error);
    }

    // Log activity
    await activityLogsService.logAction({
      userId: caller.id,
      action: 'BOOKING_RESCHEDULED',
      entityType: 'Booking',
      entityId: booking.id,
      metadata: {
        assetId: booking.assetId,
        oldStartTime: booking.startTime,
        oldEndTime: booking.endTime,
        newStartTime: data.startTime,
        newEndTime: data.endTime,
      },
    });

    return rescheduledBooking;
  }

  async getBookingDetail(id: string) {
    const booking = await bookingsRepository.getBookingById(id);
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }
    return booking;
  }

  async listBookings(
    query: { assetId?: string; startDate?: string; endDate?: string },
    pagination: { page: number; limit: number }
  ) {
    const where: Prisma.BookingWhereInput = {};

    if (query.assetId) {
      where.assetId = query.assetId;
    }

    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) {
        where.startTime.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.startTime.lte = new Date(query.endDate);
      }
    }

    return bookingsRepository.findAllBookings(where, pagination);
  }

  async getBookingCalendar(assetId: string) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    const bookings = await bookingsRepository.getAssetBookingsForCalendar(assetId);

    return bookings.map((b) => ({
      id: b.id,
      title: `Booked by ${b.bookedBy.name}`,
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(),
      status: b.status,
      bookedById: b.bookedById,
    }));
  }
}

export const bookingsService = new BookingsService();
