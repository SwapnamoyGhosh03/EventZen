import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const vendorController = new VendorController();

// Authenticated
router.get('/', authenticate, vendorController.list);

// Admin only
router.post('/', authenticate, authorize('ADMIN'), vendorController.create);

// Admin or Organizer
router.post('/:id/reviews', authenticate, authorize('ADMIN', 'ORGANIZER'), vendorController.submitReview);

export default router;
