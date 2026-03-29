import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/preference.controller';

const router = Router();

router.get('/', authenticate, ctrl.getPreferences);
router.post('/', authenticate, ctrl.updatePreferences);

export default router;
