import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/notification.controller';

const router = Router();

// Internal / service-to-service
router.post('/send', ctrl.sendNotification);

// Authenticated user endpoints — static paths MUST come before /:id wildcards
router.get('/', authenticate, ctrl.getNotifications);
router.get('/unread-count', authenticate, ctrl.getUnreadCount);
router.get('/delivery-logs', authenticate, authorize('ADMIN'), ctrl.getDeliveryLogs);
router.patch('/mark-all-read', authenticate, ctrl.markAllAsRead);
router.get('/:id', authenticate, ctrl.getNotificationById);
router.patch('/:id/read', authenticate, ctrl.markAsRead);
router.delete('/:id', authenticate, ctrl.deleteNotification);

export default router;
