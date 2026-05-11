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

function parseBoolean(value, defaultValue = false) {
  if (value == null || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseNumber(value, defaultValue) {
  if (value == null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const defaultCorsOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const configuredCorsOrigins = parseList(process.env.CORS_ORIGIN);
const isTest = process.env.NODE_ENV === 'test';
const useDbSsl = parseBoolean(process.env.DB_SSL);
const rejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);
const assistantEnabled = parseBoolean(process.env.AI_ASSISTANT_ENABLED);

const config = {
  serverPort: Number(process.env.SERVER_PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: [...new Set([...defaultCorsOrigins, ...configuredCorsOrigins])],
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: requireEnv('POSTGRES_USER'),
    password: requireEnv('POSTGRES_PASSWORD'),
    database: isTest ? process.env.TEST_POSTGRES_DB || 'saas_test' : requireEnv('POSTGRES_DB'),
    ...(useDbSsl
      ? {
          ssl: {
            rejectUnauthorized,
          },
        }
      : {}),
  },
  jwtSecret: requireEnv('JWT_SECRET'),
  ai: {
    enabled: assistantEnabled,
    provider: (process.env.AI_PROVIDER || 'bedrock').trim().toLowerCase(),
    bedrockRegion: (process.env.AI_BEDROCK_REGION || process.env.AWS_REGION || '').trim(),
    bedrockModelId: (process.env.AI_BEDROCK_MODEL_ID || '').trim(),
    bedrockInferenceProfileId: (process.env.AI_BEDROCK_INFERENCE_PROFILE_ID || '').trim(),
    systemPrompt:
      process.env.AI_SYSTEM_PROMPT ||
      'You are SekuroChat-lite, a secure internal workspace assistant. Answer only using the tenant-authorized context provided to you. If the answer is not supported by the authorized context, say so clearly and do not invent facts.',
    maxInputMessages: parseNumber(process.env.AI_MAX_INPUT_MESSAGES, 12),
    maxKnowledgeItems: parseNumber(process.env.AI_MAX_KNOWLEDGE_ITEMS, 6),
    maxResponseTokens: parseNumber(process.env.AI_MAX_RESPONSE_TOKENS, 600),
    temperature: parseNumber(process.env.AI_TEMPERATURE, 0.2),
    maxUserRequestsPerWindow: parseNumber(process.env.AI_MAX_USER_REQUESTS_PER_WINDOW, 20),
    maxTenantRequestsPerWindow: parseNumber(process.env.AI_MAX_TENANT_REQUESTS_PER_WINDOW, 100),
    maxTenantRequestsPerDay: parseNumber(process.env.AI_MAX_TENANT_REQUESTS_PER_DAY, 500),
  },
};

module.exports = config;
