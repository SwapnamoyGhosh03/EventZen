import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (t) => {
    t.uuid('user_id').primary().defaultTo(knex.fn.uuid());
    t.string('email', 255).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('phone', 50).nullable();
    t.string('avatar_url', 500).nullable();
    t.boolean('is_email_verified').defaultTo(false);
    t.boolean('is_mfa_enabled').defaultTo(false);
    t.string('mfa_secret', 255).nullable();
    t.enum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).defaultTo('PENDING_VERIFICATION');
    t.string('email_verification_token', 255).nullable();
    t.timestamp('email_verification_expires').nullable();
    t.string('password_reset_token', 255).nullable();
    t.timestamp('password_reset_expires').nullable();
    t.string('google_id', 255).nullable().unique();
    t.timestamps(true, true);
    t.timestamp('deleted_at').nullable();

    t.index('email');
    t.index('status');
    t.index('google_id');
  });

  await knex.schema.createTable('roles', (t) => {
    t.uuid('role_id').primary().defaultTo(knex.fn.uuid());
    t.string('role_name', 50).notNullable().unique();
    t.string('description', 255).nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('permissions', (t) => {
    t.uuid('permission_id').primary().defaultTo(knex.fn.uuid());
    t.string('module', 50).notNullable();
    t.string('action', 50).notNullable();
    t.string('resource_type', 50).nullable();
    t.string('description', 255).nullable();
    t.unique(['module', 'action']);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('user_roles', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    t.uuid('role_id').notNullable().references('role_id').inTable('roles').onDelete('CASCADE');
    t.uuid('assigned_by').nullable().references('user_id').inTable('users');
    t.timestamp('assigned_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'role_id']);
  });

  await knex.schema.createTable('role_permissions', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('role_id').notNullable().references('role_id').inTable('roles').onDelete('CASCADE');
    t.uuid('permission_id').notNullable().references('permission_id').inTable('permissions').onDelete('CASCADE');
    t.unique(['role_id', 'permission_id']);
  });

  await knex.schema.createTable('refresh_tokens', (t) => {
    t.uuid('token_id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    t.string('token_hash', 255).notNullable().unique();
    t.string('family_id', 255).notNullable();
    t.timestamp('expires_at').notNullable();
    t.boolean('revoked').defaultTo(false);
    t.string('ip_address', 45).nullable();
    t.string('user_agent', 500).nullable();
    t.timestamps(true, true);

    t.index('user_id');
    t.index('family_id');
    t.index('token_hash');
  });

  await knex.schema.createTable('account_requests', (t) => {
    t.uuid('request_id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').nullable().references('user_id').inTable('users');
    t.enum('type', ['VENDOR_ACCESS', 'DEACTIVATE', 'REACTIVATE', 'GDPR_DELETE']).notNullable();
    t.enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).defaultTo('PENDING');
    t.text('reason').nullable();
    t.text('admin_notes').nullable();
    t.uuid('reviewed_by').nullable().references('user_id').inTable('users');
    t.timestamp('reviewed_at').nullable();
    t.string('email_for_reactivation', 255).nullable();
    t.timestamps(true, true);

    t.index(['user_id', 'status']);
    t.index(['type', 'status']);
  });

  await knex.schema.createTable('audit_log', (t) => {
    t.bigIncrements('log_id').primary();
    t.uuid('user_id').nullable().references('user_id').inTable('users').onDelete('SET NULL');
    t.string('action', 100).notNullable();
    t.string('resource_type', 50).notNullable();
    t.string('resource_id', 100).nullable();
    t.json('old_value').nullable();
    t.json('new_value').nullable();
    t.string('ip_address', 45).nullable();
    t.string('user_agent', 500).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.index('user_id');
    t.index(['resource_type', 'resource_id']);
    t.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_log');
  await knex.schema.dropTableIfExists('account_requests');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
}
