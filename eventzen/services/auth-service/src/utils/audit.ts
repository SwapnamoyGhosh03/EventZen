import db from '../database/connection';

interface AuditEntry {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: object;
  newValue?: object;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  await db('audit_log').insert({
    user_id: entry.userId,
    action: entry.action,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId,
    old_value: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
    new_value: entry.newValue ? JSON.stringify(entry.newValue) : null,
    ip_address: entry.ipAddress,
    user_agent: entry.userAgent,
  });
}
