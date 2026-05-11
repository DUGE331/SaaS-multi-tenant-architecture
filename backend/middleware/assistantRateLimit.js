const { ipKeyGenerator, rateLimit } = require('express-rate-limit');

const config = require('../config');

const isTest = process.env.NODE_ENV === 'test';

const assistantUserRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isTest ? 1000 : config.ai.maxUserRequestsPerWindow,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req) {
    return `${req.user?.tenantId || ipKeyGenerator(req.ip)}:${req.user?.userId || 'anonymous'}`;
  },
  message: {
    error: 'Too many assistant requests. Please slow down and try again shortly.',
  },
});

const assistantTenantRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isTest ? 5000 : config.ai.maxTenantRequestsPerWindow,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req) {
    return req.user?.tenantId || ipKeyGenerator(req.ip);
  },
  message: {
    error: 'This tenant has reached the temporary assistant request limit. Please try again shortly.',
  },
});

module.exports = {
  assistantTenantRateLimit,
  assistantUserRateLimit,
};
