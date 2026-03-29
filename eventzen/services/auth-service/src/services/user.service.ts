import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { revokeAllUserTokens } from './token.service';
import { invalidateUserCache } from '../cache/redis';
import { logAudit } from '../utils/audit';

export async function listUsers(params: {
  page: number;
  size: number;
  status?: string;
  role?: string;
  search?: string;
}) {
  const { page, size, status, role, search } = params;
  const offset = (page - 1) * size;

  let query = db('users').whereNull('deleted_at');

  if (status) query = query.where('status', status);
  if (search) {
    query = query.where((qb) => {
      qb.where('first_name', 'like', `%${search}%`)
        .orWhere('last_name', 'like', `%${search}%`)
        .orWhere('email', 'like', `%${search}%`);
    });
  }

  if (role) {
    query = query.whereIn('user_id', function () {
      this.select('user_id')
        .from('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.role_id')
        .where('roles.role_name', role);
    });
  }

  const [{ total }] = await query.clone().count('* as total');
  const users = await query
    .select('user_id', 'email', 'first_name', 'last_name', 'phone', 'status', 'is_email_verified', 'created_at')
    .offset(offset)
    .limit(size)
    .orderBy('created_at', 'desc');

  // Fetch roles for all returned users in one query
  const userIds = users.map((u: any) => u.user_id);
  const userRoles: { user_id: string; role_name: string }[] = userIds.length
    ? await db('user_roles')
        .join('roles', 'user_roles.role_id', 'roles.role_id')
        .whereIn('user_roles.user_id', userIds)
        .select('user_roles.user_id', 'roles.role_name')
    : [];

  const rolesByUserId: Record<string, string[]> = {};
  for (const r of userRoles) {
    if (!rolesByUserId[r.user_id]) rolesByUserId[r.user_id] = [];
    rolesByUserId[r.user_id].push(r.role_name);
  }

  return {
    data: users.map((u: any) => ({
      userId: u.user_id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      status: u.status,
      isEmailVerified: u.is_email_verified,
      createdAt: u.created_at,
      roles: rolesByUserId[u.user_id] ?? ['CUSTOMER'],
    })),
    meta: {
      page,
      size,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / size),
    },
  };
}

export async function assignRoles(userId: string, roles: string[], assignedBy: string) {
  const user = await db('users').where({ user_id: userId }).whereNull('deleted_at').first();
  if (!user) throw new AppError(404, 'AUTH-1009', 'User not found');

  const roleRecords = await db('roles').whereIn('role_name', roles);
  if (roleRecords.length !== roles.length) {
    throw new AppError(400, 'AUTH-1002', 'One or more invalid roles');
  }

  const oldRoles = await db('user_roles')
    .join('roles', 'user_roles.role_id', 'roles.role_id')
    .where('user_roles.user_id', userId)
    .select('roles.role_name');

  await db('user_roles').where({ user_id: userId }).del();
  const inserts = roleRecords.map((r: any) => ({
    id: uuidv4(),
    user_id: userId,
    role_id: r.role_id,
    assigned_by: assignedBy,
  }));
  await db('user_roles').insert(inserts);

  await invalidateUserCache(userId);
  await logAudit({
    userId: assignedBy,
    action: 'ASSIGN_ROLES',
    resourceType: 'user',
    resourceId: userId,
    oldValue: { roles: oldRoles.map((r: any) => r.role_name) },
    newValue: { roles },
  });

  return { userId, roles };
}

export async function deactivateUser(userId: string, adminId: string) {
  const user = await db('users').where({ user_id: userId }).whereNull('deleted_at').first();
  if (!user) throw new AppError(404, 'AUTH-1009', 'User not found');

  await db('users').where({ user_id: userId }).update({ status: 'INACTIVE', deleted_at: new Date() });
  await revokeAllUserTokens(userId);
  await invalidateUserCache(userId);

  await logAudit({ userId: adminId, action: 'DEACTIVATE_USER', resourceType: 'user', resourceId: userId });
}

export async function reactivateUser(userId: string, adminId: string) {
  const user = await db('users').where({ user_id: userId }).first();
  if (!user) throw new AppError(404, 'AUTH-1009', 'User not found');

  await db('users').where({ user_id: userId }).update({ status: 'ACTIVE', deleted_at: null });
  await invalidateUserCache(userId);
  await logAudit({ userId: adminId, action: 'REACTIVATE_USER', resourceType: 'user', resourceId: userId });
}

export async function gdprDelete(userId: string, adminId: string) {
  const user = await db('users').where({ user_id: userId }).first();
  if (!user) throw new AppError(404, 'AUTH-1009', 'User not found');

  await revokeAllUserTokens(userId);
  await db('account_requests').where({ user_id: userId }).del();

  // Anonymize audit logs
  await db('audit_log').where({ user_id: userId }).update({ user_id: null });

  // Anonymize user record
  await db('users').where({ user_id: userId }).update({
    email: `deleted_${userId}@anonymized.local`,
    password_hash: 'DELETED',
    first_name: 'DELETED',
    last_name: 'USER',
    phone: null,
    avatar_url: null,
    google_id: null,
    mfa_secret: null,
    status: 'INACTIVE',
    deleted_at: new Date(),
  });

  await invalidateUserCache(userId);
  await logAudit({ userId: adminId, action: 'GDPR_DELETE', resourceType: 'user', resourceId: userId });
}
