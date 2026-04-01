process.env.NODE_ENV = 'test';

const { Client } = require('pg');

const config = require('../config');
const knexConfig = require('../knexfile');

async function ensureTestDatabase() {
  const adminClient = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres',
  });

  await adminClient.connect();

  try {
    const databaseName = config.db.database;
    const result = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);

    if (result.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await adminClient.end();
  }
}

async function runMigrations() {
  const environmentConfig = {
    ...knexConfig.development,
    connection: config.db,
  };

  const knex = require('knex')(environmentConfig);

  try {
    await knex.migrate.latest();
  } finally {
    await knex.destroy();
  }
}

async function main() {
  await ensureTestDatabase();
  await runMigrations();
  console.log(`Test database ready: ${config.db.database}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
