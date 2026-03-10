require('dotenv').config({ path: '../.env' });

const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.POSTGRES_USER || 'saas_user',
    password: process.env.POSTGRES_PASSWORD || 'saas_pass',
    database: process.env.POSTGRES_DB || 'saas_dev',
  },
  pool: {
    min: 2,
    max: 10,
  },
});

module.exports = db;
