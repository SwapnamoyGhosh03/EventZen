import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/template.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), ctrl.getTemplates);
router.post('/', authenticate, authorize('ADMIN'), ctrl.createTemplate);
router.put('/:id', authenticate, authorize('ADMIN'), ctrl.updateTemplate);
router.post('/:id/preview', authenticate, authorize('ADMIN'), ctrl.previewTemplate);

export default router;
