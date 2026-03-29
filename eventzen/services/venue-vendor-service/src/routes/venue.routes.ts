import { Router } from 'express';
import { VenueController } from '../controllers/venue.controller';
import { VenueBookingController } from '../controllers/venueBooking.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const venueController = new VenueController();
const bookingController = new VenueBookingController();

// Public
router.get('/', venueController.list);

// Authenticated
router.get('/bookings', authenticate, authorize('ADMIN', 'ORGANIZER', 'VENDOR'), bookingController.listBookings);
router.get('/:id', authenticate, venueController.getById);
router.get('/:id/availability', authenticate, bookingController.checkAvailability);

// Admin only
router.post('/', authenticate, authorize('ADMIN'), venueController.create);
router.put('/:id', authenticate, authorize('ADMIN'), venueController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), venueController.deactivate);

// Admin, Organizer, or Vendor
router.post('/:id/book', authenticate, authorize('ADMIN', 'ORGANIZER', 'VENDOR'), bookingController.bookVenue);

export default router;
