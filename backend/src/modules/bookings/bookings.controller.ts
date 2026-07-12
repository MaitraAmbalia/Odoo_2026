import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { bookingsService } from './bookings.service';

export class BookingsController {
  createBooking = asyncHandler(async (req: Request, res: Response) => {
    const bookedById = req.user!.id;
    const booking = await bookingsService.createBooking(bookedById, req.body);
    ApiResponse.created(res, booking, 'Booking created successfully');
  });

  cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { id } = req.params as { id: string };

    const booking = await bookingsService.cancelBooking(id, caller, req.body);
    ApiResponse.success(res, booking, 'Booking cancelled successfully');
  });

  rescheduleBooking = asyncHandler(async (req: Request, res: Response) => {
    const caller = req.user!;
    const { id } = req.params as { id: string };

    const booking = await bookingsService.rescheduleBooking(id, caller, req.body);
    ApiResponse.success(res, booking, 'Booking rescheduled successfully');
  });

  getBookingDetail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const booking = await bookingsService.getBookingDetail(id);
    ApiResponse.success(res, booking);
  });

  listBookings = asyncHandler(async (req: Request, res: Response) => {
    const { assetId, startDate, endDate, page, limit } = req.query as any;

    const { items, total } = await bookingsService.listBookings(
      { assetId, startDate, endDate },
      {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      }
    );

    ApiResponse.paginated(res, items, total, Number(page) || 1, Number(limit) || 20);
  });

  getCalendarBookings = asyncHandler(async (req: Request, res: Response) => {
    const { assetId } = req.params as { assetId: string };
    const calendarData = await bookingsService.getBookingCalendar(assetId);
    ApiResponse.success(res, calendarData);
  });
}

export const bookingsController = new BookingsController();
