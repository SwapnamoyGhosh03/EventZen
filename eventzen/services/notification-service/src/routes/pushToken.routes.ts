import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/pushToken.controller';

const router = Router();

router.get('/', authenticate, ctrl.getTokens);
router.post('/', authenticate, ctrl.registerToken);
router.delete('/', authenticate, ctrl.removeToken);

export default router;
