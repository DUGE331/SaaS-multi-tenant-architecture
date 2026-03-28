const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

function parseList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

const defaultCorsOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const configuredCorsOrigins = parseList(process.env.CORS_ORIGIN);

const config = {
  serverPort: Number(process.env.SERVER_PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: [...new Set([...defaultCorsOrigins, ...configuredCorsOrigins])],
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: requireEnv('POSTGRES_USER'),
    password: requireEnv('POSTGRES_PASSWORD'),
    database: requireEnv('POSTGRES_DB'),
  },
  jwtSecret: requireEnv('JWT_SECRET'),
};

module.exports = config;
