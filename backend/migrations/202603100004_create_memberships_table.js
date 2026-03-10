exports.up = async function up(knex) {
  await knex.schema.createTable('memberships', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('role', 50).notNullable().defaultTo('member');
    table.timestamps(true, true);

    table.unique(['tenant_id', 'user_id']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('memberships');
};
