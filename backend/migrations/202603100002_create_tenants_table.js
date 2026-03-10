exports.up = async function up(knex) {
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 150).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.string('status', 30).notNullable().defaultTo('active');
    table.timestamps(true, true);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('tenants');
};
