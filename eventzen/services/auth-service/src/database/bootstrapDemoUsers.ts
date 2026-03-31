import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

type DemoAccount = {
  userId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'admin@eventzen.local',
    password: 'Admin@123',
    firstName: 'System',
    lastName: 'Admin',
    phone: '+91-9000000001',
    role: 'ADMIN',
  },
  {
    userId: '22222222-2222-2222-2222-222222222222',
    email: 'organizer@eventzen.local',
    password: 'Organizer@123',
    firstName: 'Olivia',
    lastName: 'Organizer',
    phone: '+91-9000000002',
    role: 'ORGANIZER',
  },
  {
    userId: '33333333-3333-3333-3333-333333333333',
    email: 'attendee@eventzen.local',
    password: 'Attendee@123',
    firstName: 'Aarav',
    lastName: 'Attendee',
    phone: '+91-9000000003',
    role: 'ATTENDEE',
  },
];

export async function bootstrapDemoUsers(knex: Knex): Promise<void> {
  const roleRecords = await knex('roles').select('role_id', 'role_name');
  if (!roleRecords || roleRecords.length === 0) return;

  const roleMap = new Map<string, string>();
  for (const role of roleRecords as Array<{ role_id: string; role_name: string }>) {
    roleMap.set(role.role_name, role.role_id);
  }

  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    const existing = await knex('users').where({ email: account.email }).first();

    let userId = account.userId;

    if (existing) {
      userId = existing.user_id;
      await knex('users')
        .where({ user_id: userId })
        .update({
          password_hash: passwordHash,
          first_name: account.firstName,
          last_name: account.lastName,
          phone: account.phone,
          status: 'ACTIVE',
          is_email_verified: true,
          deleted_at: null,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex('users').insert({
        user_id: account.userId,
        email: account.email,
        password_hash: passwordHash,
        first_name: account.firstName,
        last_name: account.lastName,
        phone: account.phone,
        status: 'ACTIVE',
        is_email_verified: true,
      });
      userId = account.userId;
    }

    const roleId = roleMap.get(account.role);
    if (!roleId) continue;

    await knex('user_roles')
      .insert({
        id: uuidv4(),
        user_id: userId,
        role_id: roleId,
        assigned_by: null,
      })
      .onConflict(['user_id', 'role_id'])
      .ignore();
  }
}
