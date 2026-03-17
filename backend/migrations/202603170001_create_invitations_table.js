exports.up = async function up(knex) {
  await knex.schema.createTable('invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');
    table
      .uuid('invited_by_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('full_name', 150);
    table.string('role', 50).notNullable().defaultTo('member');
    table.string('token', 128).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('accepted_at');
    table.timestamps(true, true);

    table.index(['tenant_id']);
    table.index(['email']);
    table.unique(['tenant_id', 'email', 'accepted_at']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('invitations');
};
