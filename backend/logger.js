const pino = require('pino');
const pinoHttp = require('pino-http');

const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
  enabled: !isTest,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.message',
      'req.body.content',
      'req.body.password',
      'req.body.POSTGRES_PASSWORD',
      'req.body.JWT_SECRET',
      'headers.authorization',
      'headers.cookie',
    ],
    censor: '[REDACTED]',
  },
});

const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore(req) {
      return req.url === '/health';
    },
  },
});

module.exports = {
  logger,
  httpLogger,
};
