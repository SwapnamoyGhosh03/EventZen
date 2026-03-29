import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('role_permissions').del();
  await knex('user_roles').del();
  await knex('permissions').del();
  await knex('roles').del();

  const roles = [
    { role_id: uuidv4(), role_name: 'ADMIN', description: 'System administrator with full access' },
    { role_id: uuidv4(), role_name: 'ORGANIZER', description: 'Event organizer' },
    { role_id: uuidv4(), role_name: 'VENDOR', description: 'Service vendor' },
    { role_id: uuidv4(), role_name: 'ATTENDEE', description: 'Event attendee' },
  ];
  await knex('roles').insert(roles);

  const modules = ['event', 'venue', 'vendor', 'ticket', 'budget', 'user', 'report', 'notification'];
  const actions = ['create', 'read', 'update', 'delete', 'approve', 'export'];

  const permissions: Array<{ permission_id: string; module: string; action: string; description: string }> = [];
  for (const mod of modules) {
    for (const action of actions) {
      permissions.push({
        permission_id: uuidv4(),
        module: mod,
        action,
        description: `${action} ${mod}`,
      });
    }
  }
  await knex('permissions').insert(permissions);

  const adminRole = roles.find((r) => r.role_name === 'ADMIN')!;
  const organizerRole = roles.find((r) => r.role_name === 'ORGANIZER')!;
  const attendeeRole = roles.find((r) => r.role_name === 'ATTENDEE')!;

  // ADMIN gets all permissions
  const adminPerms = permissions.map((p) => ({
    id: uuidv4(),
    role_id: adminRole.role_id,
    permission_id: p.permission_id,
  }));
  await knex('role_permissions').insert(adminPerms);

  // ORGANIZER gets event:*, venue:read, vendor:*, ticket:*, budget:*, report:read
  const organizerPermNames = [
    ...permissions.filter((p) => p.module === 'event'),
    ...permissions.filter((p) => p.module === 'venue' && p.action === 'read'),
    ...permissions.filter((p) => p.module === 'vendor'),
    ...permissions.filter((p) => p.module === 'ticket'),
    ...permissions.filter((p) => p.module === 'budget'),
    ...permissions.filter((p) => p.module === 'report' && p.action === 'read'),
  ];
  const organizerPerms = organizerPermNames.map((p) => ({
    id: uuidv4(),
    role_id: organizerRole.role_id,
    permission_id: p.permission_id,
  }));
  await knex('role_permissions').insert(organizerPerms);

  // ATTENDEE gets event:read, ticket:read, ticket:create
  const attendeePermNames = permissions.filter(
    (p) =>
      (p.module === 'event' && p.action === 'read') ||
      (p.module === 'ticket' && p.action === 'read') ||
      (p.module === 'ticket' && p.action === 'create')
  );
  const attendeePerms = attendeePermNames.map((p) => ({
    id: uuidv4(),
    role_id: attendeeRole.role_id,
    permission_id: p.permission_id,
  }));
  await knex('role_permissions').insert(attendeePerms);
}
