import { Router } from 'express';
import * as userCtrl from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), userCtrl.listUsers);
router.put('/:id/roles', authenticate, authorize('ADMIN'), userCtrl.assignRoles);
router.delete('/:id', authenticate, authorize('ADMIN'), userCtrl.deactivateUser);
router.patch('/:id/reactivate', authenticate, authorize('ADMIN'), userCtrl.reactivateUser);
router.delete('/:id/gdpr/delete', authenticate, authorize('ADMIN'), userCtrl.gdprDelete);

export default router;
