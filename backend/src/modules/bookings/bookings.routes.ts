import { Router } from 'express';
import { bookingsController } from './bookings.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  CreateBookingSchema,
  RescheduleBookingSchema,
  CancelBookingSchema,
  BookingParamsSchema,
  AssetCalendarParamsSchema,
} from './bookings.schema';
import { paginationSchema } from '../../common/pagination';
import { z } from 'zod';

const router = Router();

// Apply authentication to all booking endpoints
router.use(authenticate);

// Extended list validation to support query parameters
const ListBookingsQuerySchema = z.object({
  query: paginationSchema.extend({
    assetId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

router.get('/', validate(ListBookingsQuerySchema), bookingsController.listBookings);
router.post('/', validate(CreateBookingSchema), bookingsController.createBooking);
router.get('/asset/:assetId/calendar', validate(AssetCalendarParamsSchema), bookingsController.getCalendarBookings);
router.get('/:id', validate(BookingParamsSchema), bookingsController.getBookingDetail);
router.patch('/:id/cancel', validate(BookingParamsSchema), validate(CancelBookingSchema), bookingsController.cancelBooking);
router.patch('/:id/reschedule', validate(BookingParamsSchema), validate(RescheduleBookingSchema), bookingsController.rescheduleBooking);

export default router;
