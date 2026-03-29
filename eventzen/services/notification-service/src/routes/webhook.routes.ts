import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/webhook.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), ctrl.getWebhooks);
router.post('/', authenticate, authorize('ADMIN'), ctrl.createWebhook);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteWebhook);

export default router;
