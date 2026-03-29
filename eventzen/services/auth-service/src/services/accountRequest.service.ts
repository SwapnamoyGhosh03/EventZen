import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { assignRoles, deactivateUser, reactivateUser, gdprDelete } from './user.service';

export async function createRequest(userId: string, type: string, reason?: string) {
  const requestId = uuidv4();
  await db('account_requests').insert({
    request_id: requestId,
    user_id: userId,
    type,
    status: 'PENDING',
    reason: reason || null,
  });
  return { requestId, userId, type, status: 'PENDING', reason };
}

export async function getMyRequests(userId: string, page: number, size: number) {
  const offset = (page - 1) * size;
  const [{ total }] = await db('account_requests').where({ user_id: userId }).count('* as total');
  const requests = await db('account_requests')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .offset(offset)
    .limit(size);

  return {
    data: requests.map((r: any) => ({
      requestId: r.request_id,
      type: r.type,
      status: r.status,
      reason: r.reason,
      adminNotes: r.admin_notes,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
    })),
    meta: { page, size, total: Number(total), totalPages: Math.ceil(Number(total) / size) },
  };
}

export async function cancelRequest(requestId: string, userId: string) {
  const request = await db('account_requests').where({ request_id: requestId, user_id: userId, status: 'PENDING' }).first();
  if (!request) throw new AppError(404, 'AUTH-1009', 'Request not found or not cancellable');

  await db('account_requests').where({ request_id: requestId }).update({ status: 'CANCELLED' });
}

export async function createPublicReactivation(email: string, reason?: string) {
  const requestId = uuidv4();
  await db('account_requests').insert({
    request_id: requestId,
    type: 'REACTIVATE',
    status: 'PENDING',
    reason: reason || null,
    email_for_reactivation: email,
  });
  return { requestId, type: 'REACTIVATE', status: 'PENDING' };
}

export async function checkReactivationStatus(email: string) {
  const request = await db('account_requests')
    .where({ email_for_reactivation: email, type: 'REACTIVATE' })
    .orderBy('created_at', 'desc')
    .first();

  if (!request) return { status: 'NOT_FOUND' };
  return { status: request.status, createdAt: request.created_at, reviewedAt: request.reviewed_at };
}

export async function getAdminQueue(params: { type?: string; status?: string; page: number; size: number }) {
  const { type, status, page, size } = params;
  const offset = (page - 1) * size;

  let query = db('account_requests');
  if (type) query = query.where('type', type);
  if (status) query = query.where('status', status);

  const [{ total }] = await query.clone().count('* as total');
  const requests = await query.orderBy('created_at', 'desc').offset(offset).limit(size);

  return {
    data: requests.map((r: any) => ({
      requestId: r.request_id,
      userId: r.user_id,
      type: r.type,
      status: r.status,
      reason: r.reason,
      adminNotes: r.admin_notes,
      emailForReactivation: r.email_for_reactivation,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
    })),
    meta: { page, size, total: Number(total), totalPages: Math.ceil(Number(total) / size) },
  };
}

export async function approveRequest(requestId: string, adminId: string) {
  const request = await db('account_requests').where({ request_id: requestId, status: 'PENDING' }).first();
  if (!request) throw new AppError(404, 'AUTH-1009', 'Request not found');

  await db('account_requests').where({ request_id: requestId }).update({
    status: 'APPROVED',
    reviewed_by: adminId,
    reviewed_at: new Date(),
  });

  // Execute side effects
  switch (request.type) {
    case 'VENDOR_ACCESS':
      if (request.user_id) {
        await assignRoles(request.user_id, ['VENDOR', 'ORGANIZER'], adminId);
      }
      break;
    case 'DEACTIVATE':
      if (request.user_id) await deactivateUser(request.user_id, adminId);
      break;
    case 'REACTIVATE':
      if (request.user_id) {
        await reactivateUser(request.user_id, adminId);
      } else if (request.email_for_reactivation) {
        const user = await db('users').where({ email: request.email_for_reactivation }).first();
        if (user) await reactivateUser(user.user_id, adminId);
      }
      break;
    case 'GDPR_DELETE':
      if (request.user_id) await gdprDelete(request.user_id, adminId);
      break;
  }

  return { requestId, status: 'APPROVED' };
}

export async function rejectRequest(requestId: string, adminId: string, adminNotes?: string) {
  const request = await db('account_requests').where({ request_id: requestId, status: 'PENDING' }).first();
  if (!request) throw new AppError(404, 'AUTH-1009', 'Request not found');

  await db('account_requests').where({ request_id: requestId }).update({
    status: 'REJECTED',
    reviewed_by: adminId,
    reviewed_at: new Date(),
    admin_notes: adminNotes || null,
  });

  return { requestId, status: 'REJECTED' };
}
