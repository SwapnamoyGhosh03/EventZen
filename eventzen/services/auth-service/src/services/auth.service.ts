import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeTokenFamily,
  revokeAllUserTokens,
  blacklistAccessToken,
  getUserRolesAndPermissions,
} from './token.service';
import { publishEvent } from '../events/kafkaProducer';
import { cacheUserProfile, getCachedUserProfile, invalidateUserCache, storeOtp, getOtp, deleteOtp } from '../cache/redis';
import { sendOtpEmail } from './email.service';
import { config } from '../config';
import logger from '../utils/logger';

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const existing = await db('users').where({ email: data.email }).whereNull('deleted_at').first();
  if (existing) {
    if (existing.status === 'PENDING_VERIFICATION') {
      // Resend OTP for pending users
      const otp = generateOtp();
      await storeOtp(data.email, otp);
      logger.info(`[OTP] Resent OTP for ${data.email}: ${otp}`);
      const emailSent = await sendOtpEmail(data.email, otp, existing.first_name);
      return {
        userId: existing.user_id,
        email: data.email,
        firstName: existing.first_name,
        lastName: existing.last_name,
        status: 'PENDING_VERIFICATION',
        message: emailSent ? 'OTP resent to your email' : 'OTP generated — check the code below (email delivery unavailable)',
        ...(!emailSent && { devOtp: otp }),
      };
    }
    throw new AppError(409, 'AUTH-1003', 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const userId = uuidv4();

  await db('users').insert({
    user_id: userId,
    email: data.email,
    password_hash: passwordHash,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone || null,
    status: 'PENDING_VERIFICATION',
    is_email_verified: false,
  });

  // Assign ATTENDEE role
  const attendeeRole = await db('roles').where({ role_name: 'ATTENDEE' }).first();
  if (attendeeRole) {
    await db('user_roles').insert({ id: uuidv4(), user_id: userId, role_id: attendeeRole.role_id });
  }

  // Generate and send OTP
  const otp = generateOtp();
  await storeOtp(data.email, otp);
  logger.info(`[OTP] Registration OTP for ${data.email}: ${otp}`);
  const emailSent = await sendOtpEmail(data.email, otp, data.firstName);

  await publishEvent('user.registered', userId, {
    userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  return {
    userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    status: 'PENDING_VERIFICATION',
    message: emailSent ? 'OTP sent to your email' : 'OTP generated — check the code below (email delivery unavailable)',
    ...(!emailSent && { devOtp: otp }),
  };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function verifyOtp(email: string, otp: string) {
  const storedOtp = await getOtp(email);
  if (!storedOtp) {
    throw new AppError(400, 'AUTH-1011', 'OTP expired or not found. Please register again.');
  }
  if (storedOtp !== otp) {
    throw new AppError(400, 'AUTH-1012', 'Invalid OTP. Please try again.');
  }

  // Activate user
  const user = await db('users').where({ email, status: 'PENDING_VERIFICATION' }).first();
  if (!user) {
    throw new AppError(404, 'AUTH-1013', 'User not found or already verified');
  }

  await db('users').where({ user_id: user.user_id }).update({
    status: 'ACTIVE',
    is_email_verified: true,
  });

  await deleteOtp(email);
  logger.info(`[OTP] Email verified for ${email}`);

  return { message: 'Email verified successfully', email };
}

export async function resendOtp(email: string) {
  const user = await db('users').where({ email, status: 'PENDING_VERIFICATION' }).first();
  if (!user) {
    // Don't reveal if email exists
    return { message: 'If the email is pending verification, a new OTP has been sent' };
  }

  const otp = generateOtp();
  await storeOtp(email, otp);
  logger.info(`[OTP] Resend OTP for ${email}: ${otp}`);
  const emailSent = await sendOtpEmail(email, otp, user.first_name);

  return {
    message: emailSent ? 'A new OTP has been sent to your email' : 'OTP generated — check the code below (email delivery unavailable)',
    ...(!emailSent && { devOtp: otp }),
  };
}

export async function login(
  email: string,
  password: string,
  mfaToken?: string,
  ip?: string,
  userAgent?: string
) {
  const user = await db('users').where({ email }).whereNull('deleted_at').first();
  if (!user) {
    throw new AppError(401, 'AUTH-1001', 'Invalid email or password');
  }

  if (user.status === 'SUSPENDED') {
    throw new AppError(403, 'AUTH-1004', 'Account suspended');
  }
  if (user.status === 'INACTIVE') {
    throw new AppError(403, 'AUTH-1005', 'Account deactivated');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new AppError(401, 'AUTH-1001', 'Invalid email or password');
  }

  if (user.is_mfa_enabled) {
    if (!mfaToken) {
      throw new AppError(403, 'AUTH-1006', 'MFA token required');
    }
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: mfaToken,
      window: 1,
    });
    if (!verified) {
      throw new AppError(401, 'AUTH-1007', 'Invalid MFA token');
    }
  }

  const { roles, permissions } = await getUserRolesAndPermissions(user.user_id);

  const accessToken = generateAccessToken({
    userId: user.user_id,
    email: user.email,
    roles,
    permissions,
  });

  const { token: refreshToken, familyId } = generateRefreshToken(user.user_id);
  const refreshHash = hashToken(refreshToken);
  await storeRefreshToken(user.user_id, refreshHash, familyId, ip, userAgent);

  return { accessToken, refreshToken, user: { userId: user.user_id, email: user.email, firstName: user.first_name, lastName: user.last_name, roles } };
}

export async function refresh(oldRefreshToken: string, ip?: string, userAgent?: string) {
  const oldHash = hashToken(oldRefreshToken);
  const tokenData = await validateRefreshToken(oldHash);

  if (!tokenData) {
    // Possible reuse — check if this hash belongs to a revoked token
    const revokedRecord = await db('refresh_tokens').where({ token_hash: oldHash, revoked: true }).first();
    if (revokedRecord) {
      await revokeTokenFamily(revokedRecord.family_id);
      throw new AppError(401, 'AUTH-1008', 'Token reuse detected — all sessions revoked');
    }
    throw new AppError(401, 'AUTH-1001', 'Invalid refresh token');
  }

  await revokeRefreshToken(oldHash);

  const { roles, permissions } = await getUserRolesAndPermissions(tokenData.userId);
  const user = await db('users').where({ user_id: tokenData.userId }).first();

  const accessToken = generateAccessToken({
    userId: tokenData.userId,
    email: user.email,
    roles,
    permissions,
  });

  const { token: newRefreshToken, familyId } = generateRefreshToken(tokenData.userId, tokenData.familyId);
  const newHash = hashToken(newRefreshToken);
  await storeRefreshToken(tokenData.userId, newHash, familyId, ip, userAgent);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(accessToken: string, refreshToken?: string) {
  await blacklistAccessToken(accessToken);
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    await revokeRefreshToken(hash);
  }
}

export async function getProfile(userId: string) {
  const cached = await getCachedUserProfile(userId);
  if (cached) return cached;

  const user = await db('users')
    .where({ user_id: userId })
    .whereNull('deleted_at')
    .select('user_id', 'email', 'first_name', 'last_name', 'phone', 'avatar_url', 'status', 'is_email_verified', 'is_mfa_enabled', 'created_at')
    .first();

  if (!user) throw new AppError(404, 'AUTH-1009', 'User not found');

  const { roles, permissions } = await getUserRolesAndPermissions(userId);
  const profile = {
    userId: user.user_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    status: user.status,
    isEmailVerified: user.is_email_verified,
    isMfaEnabled: user.is_mfa_enabled,
    roles,
    permissions,
    createdAt: user.created_at,
  };

  await cacheUserProfile(userId, profile);
  return profile;
}

export async function updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) {
  const updates: Record<string, string> = {};
  if (data.firstName) updates.first_name = data.firstName;
  if (data.lastName) updates.last_name = data.lastName;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

  await db('users').where({ user_id: userId }).update(updates);
  await invalidateUserCache(userId);
  return getProfile(userId);
}

export async function forgotPassword(email: string) {
  const user = await db('users').where({ email }).whereNull('deleted_at').first();
  // Always return success to prevent email enumeration
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = hashToken(resetToken);

  await db('users').where({ user_id: user.user_id }).update({
    password_reset_token: resetTokenHash,
    password_reset_expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  await publishEvent('user.password.reset', user.user_id, {
    userId: user.user_id,
    email: user.email,
    firstName: user.first_name,
    resetUrl: `${config.baseUrl}/reset-password?token=${resetToken}`,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const user = await db('users')
    .where({ password_reset_token: tokenHash })
    .where('password_reset_expires', '>', new Date())
    .first();

  if (!user) {
    throw new AppError(400, 'AUTH-1010', 'Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ user_id: user.user_id }).update({
    password_hash: passwordHash,
    password_reset_token: null,
    password_reset_expires: null,
  });

  await revokeAllUserTokens(user.user_id);
}

export async function confirmEmailVerification(token: string) {
  const tokenHash = hashToken(token);
  const user = await db('users')
    .where({ email_verification_token: tokenHash })
    .where('email_verification_expires', '>', new Date())
    .first();

  if (!user) {
    throw new AppError(400, 'AUTH-1010', 'Invalid or expired verification token');
  }

  await db('users').where({ user_id: user.user_id }).update({
    is_email_verified: true,
    status: 'ACTIVE',
    email_verification_token: null,
    email_verification_expires: null,
  });

  await invalidateUserCache(user.user_id);
}

export async function resendVerification(email: string) {
  const user = await db('users').where({ email, status: 'PENDING_VERIFICATION' }).first();
  if (!user) return; // silent fail

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenHash = hashToken(verificationToken);

  await db('users').where({ user_id: user.user_id }).update({
    email_verification_token: verificationTokenHash,
    email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await publishEvent('user.registered', user.user_id, {
    userId: user.user_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    verificationUrl: `${config.baseUrl}/verify-email?token=${verificationToken}`,
  });
}

export async function setupMfa(userId: string) {
  const secret = speakeasy.generateSecret({ name: `EventZen:${userId}`, length: 32 });
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCode: qrCodeUrl,
  };
}

export async function verifyMfa(userId: string, token: string, secret: string) {
  const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  if (!verified) {
    throw new AppError(401, 'AUTH-1007', 'Invalid MFA token');
  }

  await db('users').where({ user_id: userId }).update({
    is_mfa_enabled: true,
    mfa_secret: secret,
  });

  await invalidateUserCache(userId);
  return { isMfaEnabled: true };
}
