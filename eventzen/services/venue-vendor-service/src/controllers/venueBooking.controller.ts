import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { bookVenueSchema, availabilityQuerySchema } from '../validators/venue.validators';
import { AppError } from '../middleware/errorHandler';

const bookingService = new BookingService();

export class VenueBookingController {
  async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = availabilityQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters', parsed.error.errors);
      }

      const venueId = req.params.id;
      const { hall_id, start, end } = parsed.data;

      const available = await bookingService.checkAvailability(
        venueId,
        hall_id,
        new Date(start),
        new Date(end)
      );

      res.json({ success: true, data: { available } });
    } catch (err) {
      next(err);
    }
  }

  async bookVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = bookVenueSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid booking data', parsed.error.errors);
      }

      const booking = await bookingService.bookVenue(
        { venue_id: req.params.id, ...parsed.data },
        req.user!.userId
      );

      res.status(201).json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }

  async listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        venue_id: req.query.venue_id as string | undefined,
        event_id: req.query.event_id as string | undefined,
        organizer_id: req.query.organizer_id as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        size: req.query.size ? Number(req.query.size) : 20,
      };

      const result = await bookingService.listBookings(filters);
      res.json({ success: true, data: result.bookings, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }
}
