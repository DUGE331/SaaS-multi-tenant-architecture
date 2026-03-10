exports.up = async function up(knex) {
  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('tenant_id')
      .notNullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');
    table.string('name', 150).notNullable();
    table.text('description');
    table.string('status', 30).notNullable().defaultTo('active');
    table.timestamps(true, true);

    table.index(['tenant_id']);
    table.unique(['tenant_id', 'name']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('projects');
};
