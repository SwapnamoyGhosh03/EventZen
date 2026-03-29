import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import db from '../database/connection';
import { blacklistToken } from '../cache/redis';

interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export function generateAccessToken(payload: TokenPayload): string {
  const jti = uuidv4();
  return jwt.sign({ ...payload, jti, sub: payload.userId, iss: 'eventzen-auth' }, config.jwt.secret, { expiresIn: '24h' });
}

export function generateRefreshToken(userId: string, familyId?: string): { token: string; familyId: string } {
  const fid = familyId || uuidv4();
  const jti = uuidv4();
  const token = jwt.sign({ userId, familyId: fid, jti }, config.jwt.refreshSecret, { expiresIn: '7d' });
  return { token, familyId: fid };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  familyId: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db('refresh_tokens').insert({
    token_id: uuidv4(),
    user_id: userId,
    token_hash: tokenHash,
    family_id: familyId,
    expires_at: expiresAt,
    ip_address: ip,
    user_agent: userAgent,
  });
}

export async function validateRefreshToken(tokenHash: string): Promise<{ userId: string; familyId: string } | null> {
  const record = await db('refresh_tokens')
    .where({ token_hash: tokenHash, revoked: false })
    .where('expires_at', '>', new Date())
    .first();

  if (!record) return null;
  return { userId: record.user_id, familyId: record.family_id };
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await db('refresh_tokens').where({ token_hash: tokenHash }).update({ revoked: true });
}

export async function revokeTokenFamily(familyId: string): Promise<void> {
  await db('refresh_tokens').where({ family_id: familyId }).update({ revoked: true });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db('refresh_tokens').where({ user_id: userId }).update({ revoked: true });
}

export async function blacklistAccessToken(token: string): Promise<void> {
  try {
    const decoded = jwt.decode(token) as { jti: string; exp: number } | null;
    if (decoded?.jti && decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await blacklistToken(decoded.jti, ttl);
      }
    }
  } catch {
    // token already invalid
  }
}

export async function getUserRolesAndPermissions(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
  const roleRows = await db('user_roles')
    .join('roles', 'user_roles.role_id', 'roles.role_id')
    .where('user_roles.user_id', userId)
    .select('roles.role_name');

  const roles = roleRows.map((r: { role_name: string }) => r.role_name);

  const permRows = await db('user_roles')
    .join('role_permissions', 'user_roles.role_id', 'role_permissions.role_id')
    .join('permissions', 'role_permissions.permission_id', 'permissions.permission_id')
    .where('user_roles.user_id', userId)
    .select('permissions.module', 'permissions.action')
    .distinct();

  const permissions = permRows.map((p: { module: string; action: string }) => `${p.module}:${p.action}`);

  return { roles, permissions };
}
