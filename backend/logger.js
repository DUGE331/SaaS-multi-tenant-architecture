const pino = require('pino');
const pinoHttp = require('pino-http');

const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
  enabled: !isTest,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
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
