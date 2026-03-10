exports.up = async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');
};

exports.down = async function down(knex) {
  await knex.raw('DROP EXTENSION IF EXISTS pgcrypto');
};
