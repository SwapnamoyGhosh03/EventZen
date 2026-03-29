import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const contractController = new ContractController();

// Hire vendor for an event (creates contract)
router.post('/contracts/event/:id', authenticate, authorize('ADMIN', 'ORGANIZER'), contractController.hireVendor);

// Get contracts for an event
router.get('/contracts/event/:id', authenticate, contractController.getByEvent);

// Update contract status
router.patch('/contracts/:id/status', authenticate, authorize('ADMIN'), contractController.updateStatus);

export default router;
