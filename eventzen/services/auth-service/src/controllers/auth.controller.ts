import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, emailVerificationSchema, resendVerificationSchema, mfaVerifySchema, updateProfileSchema, verifyOtpSchema, resendOtpSchema } from '../validators/auth.validators';
import { AppError } from '../middleware/errorHandler';

function success(res: Response, data: any, statusCode = 200) {
  res.status(statusCode).json({ success: true, data, timestamp: new Date().toISOString() });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    success(res, result, 201);
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password, body.mfaToken, req.ip, req.headers['user-agent']);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    success(res, { accessToken: result.accessToken, user: result.user });
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const oldToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!oldToken) throw new AppError(401, 'AUTH-1001', 'Refresh token required');

    const result = await authService.refresh(oldToken, req.ip, req.headers['user-agent']);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    success(res, { accessToken: result.accessToken });
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1] || '';
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(accessToken, refreshToken);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    success(res, { message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    success(res, profile);
  } catch (err) { next(err); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateProfileSchema.parse(req.body);
    const profile = await authService.updateProfile(req.user!.userId, body);
    success(res, profile);
  } catch (err) { next(err); }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(body.email);
    success(res, { message: 'If the email exists, a reset link has been sent' });
  } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(body.token, body.newPassword);
    success(res, { message: 'Password reset successful' });
  } catch (err) { next(err); }
}

export async function confirmEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const body = emailVerificationSchema.parse(req.body);
    await authService.confirmEmailVerification(body.token);
    success(res, { message: 'Email verified successfully' });
  } catch (err) { next(err); }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const body = resendVerificationSchema.parse(req.body);
    await authService.resendVerification(body.email);
    success(res, { message: 'Verification email sent if applicable' });
  } catch (err) { next(err); }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const body = verifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(body.email, body.otp);
    success(res, result);
  } catch (err) { next(err); }
}

export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const body = resendOtpSchema.parse(req.body);
    const result = await authService.resendOtp(body.email);
    success(res, result);
  } catch (err) { next(err); }
}

export async function setupMfa(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.setupMfa(req.user!.userId);
    success(res, result);
  } catch (err) { next(err); }
}

export async function verifyMfa(req: Request, res: Response, next: NextFunction) {
  try {
    const body = mfaVerifySchema.parse(req.body);
    const secret = req.body.secret;
    if (!secret) throw new AppError(400, 'AUTH-1007', 'MFA secret required');
    const result = await authService.verifyMfa(req.user!.userId, body.token, secret);
    success(res, result);
  } catch (err) { next(err); }
}
