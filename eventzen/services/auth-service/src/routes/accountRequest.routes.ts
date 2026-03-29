import { Router } from 'express';
import * as arCtrl from '../controllers/accountRequest.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, arCtrl.createRequest);
router.get('/me', authenticate, arCtrl.getMyRequests);
router.delete('/:id', authenticate, arCtrl.cancelRequest);
router.post('/public/reactivation', arCtrl.publicReactivation);
router.get('/public/reactivation/status', arCtrl.checkReactivationStatus);
router.get('/admin', authenticate, authorize('ADMIN'), arCtrl.getAdminQueue);
router.patch('/admin/:id/approve', authenticate, authorize('ADMIN'), arCtrl.approveRequest);
router.patch('/admin/:id/reject', authenticate, authorize('ADMIN'), arCtrl.rejectRequest);

export default router;
