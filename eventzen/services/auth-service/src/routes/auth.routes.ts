import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authCtrl.register);
router.post('/verify-otp', authCtrl.verifyOtp);
router.post('/resend-otp', authCtrl.resendOtp);
router.post('/login', loginLimiter, authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/logout', authenticate, authCtrl.logout);
router.get('/me', authenticate, authCtrl.getMe);
router.patch('/me/profile', authenticate, authCtrl.updateMe);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);
router.post('/email-verification/confirm', authCtrl.confirmEmail);
router.post('/email-verification/resend', authCtrl.resendVerification);
router.post('/mfa/setup', authenticate, authCtrl.setupMfa);
router.post('/mfa/verify', authenticate, authCtrl.verifyMfa);

export default router;
