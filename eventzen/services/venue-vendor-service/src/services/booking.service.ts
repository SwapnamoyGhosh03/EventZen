import { v4 as uuidv4 } from 'uuid';
import { VenueBooking, BookingStatus, IVenueBooking } from '../models/venueBooking.model';
import { Venue } from '../models/venue.model';
import { AppError } from '../middleware/errorHandler';
import { publishEvent } from '../events/kafkaProducer';

interface BookingInput {
  venue_id: string;
  hall_id?: string;
  event_id: string;
  booking_start: string;
  booking_end: string;
  notes?: string;
}

interface BookingFilters {
  venue_id?: string;
  event_id?: string;
  organizer_id?: string;
  status?: string;
  page?: number;
  size?: number;
}

export class BookingService {
  async checkAvailability(
    venueId: string,
    hallId: string | undefined,
    start: Date,
    end: Date
  ): Promise<boolean> {
    const query: Record<string, unknown> = {
      venue_id: venueId,
      status: BookingStatus.CONFIRMED,
      booking_start: { $lt: end },
      booking_end: { $gt: start },
    };

    if (hallId) {
      query.hall_id = hallId;
    }

    const conflict = await VenueBooking.findOne(query);
    return !conflict;
  }

  async bookVenue(input: BookingInput, organizerId: string): Promise<IVenueBooking> {
    const venue = await Venue.findById(input.venue_id);
    if (!venue) {
      throw new AppError(404, 'EVT-1001', 'Venue not found');
    }

    if (!venue.is_active) {
      throw new AppError(400, 'EVT-1002', 'Venue is not active');
    }

    if (input.hall_id) {
      const hall = venue.halls.find((h) => h.hall_id === input.hall_id);
      if (!hall) {
        throw new AppError(404, 'EVT-1003', 'Hall not found in this venue');
      }
    }

    const startDate = new Date(input.booking_start);
    const endDate = new Date(input.booking_end);

    if (startDate >= endDate) {
      throw new AppError(400, 'EVT-1004', 'booking_start must be before booking_end');
    }

    const isAvailable = await this.checkAvailability(
      input.venue_id,
      input.hall_id,
      startDate,
      endDate
    );

    if (!isAvailable) {
      throw new AppError(409, 'EVT-2001', 'Venue/hall is already booked for the requested time slot');
    }

    // Calculate cost if pricing available
    let totalCost: number | undefined;
    if (input.hall_id && venue.halls.length > 0) {
      const hall = venue.halls.find((h) => h.hall_id === input.hall_id);
      if (hall) {
        const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        totalCost = Math.round(hall.hourly_rate * hours * 100) / 100;
      }
    } else if (venue.pricing?.base_rate) {
      const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      totalCost = Math.round(venue.pricing.base_rate * hours * 100) / 100;
    }

    const booking = new VenueBooking({
      booking_id: uuidv4(),
      venue_id: input.venue_id,
      hall_id: input.hall_id,
      event_id: input.event_id,
      organizer_id: organizerId,
      booking_start: startDate,
      booking_end: endDate,
      status: BookingStatus.CONFIRMED,
      total_cost: totalCost,
      notes: input.notes,
    });

    const saved = await booking.save();

    await publishEvent('venue.booked', {
      booking_id: saved.booking_id,
      venue_id: saved.venue_id.toString(),
      hall_id: saved.hall_id,
      event_id: saved.event_id,
      organizer_id: saved.organizer_id,
      booking_start: saved.booking_start.toISOString(),
      booking_end: saved.booking_end.toISOString(),
      total_cost: saved.total_cost,
    });

    return saved;
  }

  async listBookings(filters: BookingFilters) {
    const page = filters.page || 1;
    const size = filters.size || 20;
    const skip = (page - 1) * size;

    const query: Record<string, unknown> = {};
    if (filters.venue_id) query.venue_id = filters.venue_id;
    if (filters.event_id) query.event_id = filters.event_id;
    if (filters.organizer_id) query.organizer_id = filters.organizer_id;
    if (filters.status) query.status = filters.status;

    const [bookings, total] = await Promise.all([
      VenueBooking.find(query).skip(skip).limit(size).sort({ createdAt: -1 }),
      VenueBooking.countDocuments(query),
    ]);

    return {
      bookings,
      meta: { page, size, total, totalPages: Math.ceil(total / size) },
    };
  }
}
