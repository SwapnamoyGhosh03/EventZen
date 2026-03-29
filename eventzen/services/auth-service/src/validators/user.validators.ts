import { z } from 'zod';

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
  role: z.string().optional(),
  search: z.string().optional(),
});

export const assignRolesSchema = z.object({
  roles: z.array(z.enum(['ADMIN', 'ORGANIZER', 'VENDOR', 'ATTENDEE'])).min(1, 'At least one role required'),
});

export const accountRequestSchema = z.object({
  type: z.enum(['VENDOR_ACCESS', 'DEACTIVATE', 'GDPR_DELETE']),
  reason: z.string().optional(),
});

export const publicReactivationSchema = z.object({
  email: z.string().email(),
  reason: z.string().optional(),
});

export const adminRejectSchema = z.object({
  adminNotes: z.string().optional(),
});
