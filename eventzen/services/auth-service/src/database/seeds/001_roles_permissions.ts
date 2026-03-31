import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

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

  // Demo users for local development and Docker bootstrap
  const demoUsers = [
    {
      user_id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@eventzen.local',
      password: 'Admin@123',
      first_name: 'System',
      last_name: 'Admin',
      phone: '+91-9000000001',
      role: 'ADMIN',
    },
    {
      user_id: '22222222-2222-2222-2222-222222222222',
      email: 'organizer@eventzen.local',
      password: 'Organizer@123',
      first_name: 'Olivia',
      last_name: 'Organizer',
      phone: '+91-9000000002',
      role: 'ORGANIZER',
    },
    {
      user_id: '33333333-3333-3333-3333-333333333333',
      email: 'attendee@eventzen.local',
      password: 'Attendee@123',
      first_name: 'Aarav',
      last_name: 'Attendee',
      phone: '+91-9000000003',
      role: 'ATTENDEE',
    },
  ];

  for (const account of demoUsers) {
    const existing = await knex('users').where({ email: account.email }).first();
    const passwordHash = await bcrypt.hash(account.password, 12);

    let userId = account.user_id;

    if (existing) {
      userId = existing.user_id;
      await knex('users')
        .where({ user_id: userId })
        .update({
          password_hash: passwordHash,
          first_name: account.first_name,
          last_name: account.last_name,
          phone: account.phone,
          status: 'ACTIVE',
          is_email_verified: true,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex('users').insert({
        user_id: account.user_id,
        email: account.email,
        password_hash: passwordHash,
        first_name: account.first_name,
        last_name: account.last_name,
        phone: account.phone,
        status: 'ACTIVE',
        is_email_verified: true,
      });
    }

    const roleRecord = roles.find((r) => r.role_name === account.role);
    if (roleRecord) {
      await knex('user_roles')
        .insert({
          id: uuidv4(),
          user_id: userId,
          role_id: roleRecord.role_id,
          assigned_by: null,
        })
        .onConflict(['user_id', 'role_id'])
        .ignore();
    }
  }
}
